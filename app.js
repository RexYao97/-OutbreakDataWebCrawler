const express = require("express");
const app = express();
const fs = require("fs");
const cheerio = require("cheerio");
const superagent = require("superagent");
let data = require("./data");
let defaultData = require("./defaultData");
let defaultDailyData = require("./dailyData");
let objecId = require("mongo-objectid");
async function httpGet() {
  await delDir('./home')
  return new Promise((res, rej) => {
    superagent
      .get(
        `https://ncov.dxy.cn/ncovh5/view/pneumonia_peopleapp?from=timeline&isappinstalled=0&scene=126&clicktime=${Date.parse(
          new Date()
        )}`
      )
      .end((_err, _res) => {
        if (_err) {
          // 如果访问失败或者出错，会这行这里
          console.log(`热点新闻抓取失败 - ${_err}`);
          rej(_err);
        } else {
          // 访问成功，请求http://news.baidu.com/页面所返回的数据会包含在res
          // 抓取热点新闻数据
          // console.log(_res)
          // console.log(_res)
          return res(_res);
        }
      });
  });
}
function delDir(path){
  let files = [];
  if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
          let curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()){
              delDir(curPath); //递归删除文件夹
          } else {
              fs.unlinkSync(curPath); //删除文件
          }
      });
      // fs.rmdirSync(path);
  }
}

app.get("/", async (req, res) => {
  let result = await httpGet();
  res.send(handleDate(result));
});


setTimeout(async ()=>{
  let result = await httpGet();
  handleDate(result)
},1000*60*60)
/**
 *
 * @param {返回数据} res
 */
function handleDate(res) {
  res = cheerio("script", res.text);
  let reslut = "";

  try {
    /**全国格式 */
    for (let [key, value] of Object.entries(res)) {
      // console.log( typeof value.children, isNaN(key))
      if (
        isData(key, value) &&
        /getListByCountryTypeService1/g.test(value.children[0].data)
      ) {
        // console.log(value.children[0].data.slice(43,-11))
        reslut = value.children[0].data.slice(43, -11);

        writeDate(JSON.parse(reslut), "全国各省");
      }
    }
  } catch (e) {
    throw new Error(e);
  }
  try {
    /**全国格式 */
    for (let [key, value] of Object.entries(res)) {
      // console.log( typeof value.children, isNaN(key))
      if (
        isData(key, value) &&
        /getStatisticsService/g.test(value.children[0].data)
      ) {
        // console.log(value.children[0].data.slice(43,-11))
        reslut = value.children[0].data.slice(36, -11);
        // console.log(JSON.parse(reslut));
        /**
          * confirmedCount: 37251, 确诊
            suspectedCount: 28942, 疑似
            curedCount: 2668, 治愈
            deadCount: 812,死亡
            seriousCount: 6188, 重症
            suspectedIncr: 3916,和昨天比较 疑似
            confirmedIncr: 2657,和昨天比较 确诊
            curedIncr: 617,和昨天比较 治愈
            deadIncr: 89,和昨天比较 死亡
            seriousIncr: 87,和昨天比较 治愈
          */

        let {
          confirmedCount,
          suspectedCount,
          curedCount,
          deadCount,
          seriousCount,
          suspectedIncr,
          confirmedIncr,
          curedIncr,
          deadIncr,
          seriousIncr
        } = JSON.parse(reslut);
        let r = Object.assign({}, defaultDailyData);
        let date = new Date();
        let str = `./home/每天的数据 ${date.getMonth() +
          1}-${date.getDate()} ${date.getHours()} ${date.getMinutes()} ${date.getMilliseconds()}.json`;
        r.data[0] = Object.assign(r.data[0], {
          confirmedCount: confirmedCount.toString(),
          suspectedCount: suspectedCount.toString(),
          curedCount: curedCount.toString(),
          deadCount: deadCount.toString(),
          seriousCount: seriousCount.toString(),
          suspectedIncr: suspectedIncr.toString(),
          confirmedIncr: confirmedIncr.toString(),
          curedIncr: curedIncr.toString(),
          deadIncr: deadIncr.toString(),
          seriousIncr: seriousIncr.toString(),
          id: new objecId().toString(),
          created_at: Date.parse(date),
          updated_at: Date.parse(date)
        });

        fs.writeFileSync(str, JSON.stringify(r));
        //   writeDate(JSON.parse(reslut), "全国各省");
      }
    }
  } catch (e) {
    throw new Error(e);
  }
  try {
    for (let [key, value] of Object.entries(res)) {
      // console.log( typeof value.children, isNaN(key))
      if (isData(key, value) && /getAreaStat/g.test(value.children[0].data)) {
        // console.log(value.children[0].data.slice(43,-11))
        reslut = value.children[0].data.slice(26, -11);
        writeDate(JSON.parse(reslut), "全国各省各市");
      }
    }
  } catch (e) {
    throw new Error(e);
  }
  return reslut;
}
/**
 *
 * @param {cheeiro 中的排位} key
 * @param {cheerio 中的 数据*} value
 */
function isData(key, value) {
  return (
    !isNaN(key) &&
    value &&
    value.children &&
    value.children.length > 0 &&
    typeof value.children[0].data === "string"
  );
}

/**
 * @param {请求的数据}}object reslut
 */
function writeDate(reslut, filename) {
  let date = new Date();
  let r = defaultData;
  //   console.log( reslut)
  let str = `./home/${filename} ${date.getMonth() +
    1}-${date.getDate()} ${date.getHours()} ${date.getMinutes()} ${date.getMilliseconds()}.json`;
  for (let item of reslut) {
    let name = getCityName(item.provinceShortName);
    // console.log(item)
    if (name) {
      r.data[0][name] = JSON.stringify(item);
    }
  }
  r.data[0]["id"] = new objecId().toString();
  // updated_at
  r.data[0]["created_at"] = Date.parse(date);
  r.data[0]["updated_at"] = Date.parse(date);
  fs.writeFileSync(str, JSON.stringify(r));
}
function getCityName(provinceShortName) {
  for (let item of data) {
    if (item.value === provinceShortName) {
      return item.name;
    }
  }
  return false;
}
let server = app.listen(3000, function() {
  let host = server.address().address;
  let port = server.address().port;
  console.log("Your App is running at http://%s:%s", host, port);
});
