/*
 * @Author: your name
 * @Date: 2020-09-03 23:24:08
 * @LastEditTime: 2020-09-04 00:02:46
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \丁香数据chuli\audio.js
 */
const path = require('path');
const fs = require('fs');
let request = require('request');
const { json } = require('express');
request = request.defaults({ jar: true });
let login = `http://liangfm.com/index.php?c=music&m=vols&id=405&page=`;
let jsonUrl = `http://liangfm.com/index.php?c=music&m=item`;
const maxPges = 26;
function delDir(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let curPath = path + '/' + file;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    });
    // fs.rmdirSync(path);
  }
}
delDir('./home');
function getMp3JsonList(body) {
  const result = []
  for(let item of body) {
    const {song_name,song_path} = item
    result.push({
      name:song_name,
      path:song_path
    })
  }
  return result
}

// 加载页面
function getUrlPage(page=1){
  return `${login}page`
}
function getLogin(){
  for(let i=1;i<=maxPges;i++){
    let url = getUrlPage(i)
    request(login).on('complete', function () {
      request(jsonUrl, function (error, response, body) {
        let mp3List = getMp3JsonList(JSON.parse(body))
        
      })
    })
  }
}

getLogin();
