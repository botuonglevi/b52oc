const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`;

let latestResult = {
  Phien: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  Tong: 0,
  Ket_qua: "",
};

let history = [];

function updateResult(d1, d2, d3, sid = null) {
  const total = d1 + d2 + d3;
  const result = total > 10 ? "Tài" : "Xỉu";
  const timeStr = new Date().toISOString().replace("T", " ").slice(0, 19);

  latestResult = {
    Phien: sid || latestResult.Phien,
    Xuc_xac_1: d1,
    Xuc_xac_2: d2,
    Xuc_xac_3: d3,
    Tong: total,
    Ket_qua: result,
    id: "@levi_4everw",
    Thoi_gian: timeStr
  };

  history.unshift({...latestResult});

  if (history.length > 100) {
    history = history.slice(0, 100);
  }

  console.log(
    `[🎲✅] Phiên ${latestResult.Phien} - ${d1}-${d2}-${d3} ➜ Tổng: ${total}, Kết quả: ${result} | ${timeStr}`
  );
}

const API_TARGET_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=b5&gid=vgmn_101';

async function fetchGameData() {
  try {
    const response = await axios.get(API_TARGET_URL, {
      timeout: 10000
    });
    const data = response.data;

    if (data?.status === "OK" && Array.isArray(data?.data) && data.data.length > 0) {
      const game = data.data[0];
      const sid = game?.sid;
      const d1 = game?.d1;
      const d2 = game?.d2;
      const d3 = game?.d3;

      if (sid && sid !== latestResult.Phien && 
          typeof d1 === 'number' && typeof d2 === 'number' && typeof d3 === 'number' &&
          d1 >= 1 && d1 <= 6 && d2 >= 1 && d2 <= 6 && d3 >= 1 && d3 <= 6) {
        updateResult(d1, d2, d3, sid);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Timeout khi gọi API");
    } else {
      console.error("❌ Lỗi khi lấy dữ liệu từ API:", error.message);
    }
  }
}

// Gọi ngay khi start
fetchGameData();

// Chạy mỗi 5 giây
setInterval(fetchGameData, 5000);

app.get("/api/b52levi", (req, res) => {
  res.json(latestResult);
});

app.get("/api/history", (req, res) => {
  res.json({
    total: history.length,
    data: history
  });
});

// Thêm endpoint ping để giữ server wake
app.get("/api/ditmemayb52", (req, res) => {
  res.json({ 
    status: "pong", 
    timestamp: new Date().toISOString(),
    phien: latestResult.Phien
  });
});

app.get("/", (req, res) => {
  res.json({ 
    status: "B52 Tài Xỉu đang chạy", 
    phien: latestResult.Phien, 
    total_history: history.length 
  });
});

// Ping chính mình mỗi 5 phút
setInterval(() => {
  if (SELF_URL.includes("http")) {
    axios.get(`${SELF_URL}/api/ditmemayb52`).catch(() => {});
  }
}, 300000);

app.listen(PORT, () => {
  console.log(`🚀 Server B52 Tài Xỉu đang chạy tại http://localhost:${PORT}`);
});
