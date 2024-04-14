const StocksList = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "PYPL",
  "TSLA",
  "JPM",
  "NVDA",
  "NFLX",
  "DIS",
];

const StockValues = {};
const ChartData = {};
const StockSummery = {};

const stockValueEl = document.querySelector("#rightSide");
const stockSummeryEl = document.getElementById("stockSummery");
const stockDetailsEls = document.querySelectorAll(".stockDetails span");

const oneMonthBtn = document.getElementById("oneMonth");
const threeMonthBtn = document.getElementById("threeMonth");
const oneYearBtn = document.getElementById("oneYear");
const fiveYearBtn = document.getElementById("fiveYear");

async function renderAllInfo() {
  await getStockInfo();
  await getChartData();
  await getStockSummery();
  renderStockDetails("AAPL");
  await renderStockInfo();
  drawChart();
}
renderAllInfo();
function renderStockInfo() {
  for (let stock in StockValues) {
    const element = `
        <div class="stockList">
            <button onclick="renderStockDetails('${stock}')">${stock}</button>
            <span>$${StockValues[stock].bookValue}</span>
            <span>${StockValues[stock].profit.toFixed(2)}%</span>
        </div>`;
    stockValueEl.innerHTML += element;
  }
}

async function getStockInfo() {
  try {
    const response = await fetch(
      "https://stocks3.onrender.com/api/stocks/getstockstatsdata"
    );
    let data = await response.json();
    data = data.stocksStatsData[0];
    for (let stock in data) {
      if (StocksList.includes(stock)) {
        StockValues[stock] = data[stock];
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function getChartData() {
  try {
    const response = await fetch(
      "https://stocks3.onrender.com/api/stocks/getstocksdata"
    );
    let data = await response.json();
    data = data.stocksData[0];
    for (let stock in data) {
      if (StocksList.includes(stock)) {
        ChartData[stock] = data[stock];
      }
    }
    console.log(ChartData);
  } catch (error) {
    console.log(error);
  }
}
async function getStockSummery() {
  try {
    const response = await fetch(
      "https://stocks3.onrender.com/api/stocks/getstocksprofiledata"
    );
    let data = await response.json();
    data = data.stocksProfileData[0];
    for (let stock in data) {
      if (StocksList.includes(stock)) {
        StockSummery[stock] = data[stock];
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function renderStockDetails(stockName) {
  drawChart(stockName);
  const { profit, bookValue } = StockValues[stockName];
  const summary = StockSummery[stockName].summary;
  stockSummeryEl.innerHTML = `<p>${summary}</p>`;
  stockDetailsEls.forEach((el) => {
    if (el.className == "stckProfit") {
      el.textContent = `${profit}%`;
    }
    if (el.className == "stockName") {
      el.textContent = stockName;
    }
    if (el.className == "stockValue") {
      el.textContent = `$${bookValue}`;
    }
  });
}

function drawChart(stockName = "AAPL", duration = "5y") {
  let data = ChartData[stockName][duration].value;
  let labels = ChartData[stockName][duration].timeStamp;


  oneMonthBtn.addEventListener('click',()=>{
    drawChart(stockName,"1mo");
  })
  threeMonthBtn.addEventListener('click',()=>{
    drawChart(stockName,"3mo");
  })
  oneYearBtn.addEventListener('click',()=>{
    drawChart(stockName,"1y");
  })
  fiveYearBtn.addEventListener('click',()=>{
    drawChart(stockName,"5y");
  })

  // Convert timestamps to readable dates
  labels = labels.map((timestamp) =>
    new Date(timestamp * 1000).toLocaleDateString()
  );

  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  // Set canvas dimensions and scaling for high DPI displays
  const scaleFactor = window.devicePixelRatio;
  canvas.width = canvas.offsetWidth * scaleFactor;
  canvas.height = canvas.offsetHeight * scaleFactor;
  ctx.scale(scaleFactor, scaleFactor);

  // Calculate chart dimensions
  const chartHeight = canvas.height - 40;
  const chartWidth = canvas.width - 60;
  const dataMax = Math.max(...data);
  const dataMin = Math.min(...data);
  const dataRange = dataMax - dataMin;
  const dataStep = dataRange > 0 ? chartHeight / dataRange : 0;
  const stepX = chartWidth / (data.length - 1);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);



  // Draw the chart
  ctx.beginPath();
  ctx.moveTo(0, chartHeight - (data[0] - dataMin) * dataStep);
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(i * stepX, chartHeight - (data[i] - dataMin) * dataStep);
  }
  ctx.strokeStyle = "#39FF14";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw a dotted horizontal line for value 0
  ctx.beginPath();
  ctx.setLineDash([2, 2]);
  const zeroY = chartHeight - (0 - dataMin) * dataStep;
  ctx.moveTo(0, zeroY);
  ctx.lineTo(canvas.width, zeroY);
  ctx.strokeStyle = "transparent";
  ctx.stroke();
  ctx.setLineDash([]); // Reset the line dash

  // Show tooltip and x-axis value on hover
  const tooltip = document.getElementById("tooltip");
  const xAxisLabel = document.getElementById("xAxisLabel");

  canvas.addEventListener("mousemove", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const dataIndex = Math.min(Math.floor(x / stepX), data.length - 1);
    const stockValue = data[dataIndex].toFixed(2);
    const xAxisValue = labels[dataIndex];

    tooltip.style.display = "block";
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y - 20}px`;
    tooltip.textContent = `${stockName}: $${stockValue}`;

    xAxisLabel.style.display = "block";
    xAxisLabel.style.fontSize = "14px";
    xAxisLabel.style.fontWeight = "bolder";
    xAxisLabel.style.left = `${x}px`;
    xAxisLabel.textContent = xAxisValue;

    //  Clear the canvas except for the vertical line and data point
    ctx.clearRect(0, 0, canvas.width, chartHeight);
    ctx.clearRect(
      0,
      chartHeight + 20,
      canvas.width,
      canvas.height - chartHeight - 20
    );

    // Draw the chart
    ctx.beginPath();
    ctx.moveTo(0, chartHeight - (data[0] - dataMin) * dataStep);
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(i * stepX, chartHeight - (data[i] - dataMin) * dataStep);
    }
    ctx.strokeStyle = "#39FF14";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the dotted horizontal line for value 0
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(canvas.width, zeroY);
    ctx.strokeStyle = "transparent";
    ctx.stroke();
    ctx.setLineDash([]); // Reset the line dash

    // Draw a vertical line at the current x position when hovering over the chart
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, chartHeight);
    ctx.strokeStyle = "#ccc";
    ctx.stroke();

    // Draw the data point as a bolder ball
    ctx.beginPath();
    ctx.arc(
      x,
      chartHeight - (data[dataIndex] - dataMin) * dataStep,
      6,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "#39FF14";
    ctx.fill();
  });

  canvas.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
    xAxisLabel.style.display = "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawChart(stockName);
  });
}
