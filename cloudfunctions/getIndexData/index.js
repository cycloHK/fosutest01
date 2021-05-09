// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init(
  {env: cloud.DYNAMIC_CURRENT_ENV}
)
const db=cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  console.log("kkkangwejkld",event)
  var num=event.num;
  var plate=event.plate;
  var page=event.page;
  var openid=event.userInfo.openId;
  if(plate==1)
  {
    return await db.collection("dynamic").orderBy("dynamic.time", "desc").skip(page).limit(num).get()
  }
  if(plate==2)
  {
    return await db.collection("dynamic").orderBy("dynamic.praise", "desc").skip(page).limit(num).get()
  }
  if(plate==3)
  {
    return await db.collection("dynamic").where({_openid:openid}).orderBy("dynamic.time", "desc").skip(page).limit(num).get()
  }
  if(plate==4)
  {
    return await db.collection("dynamic").where({_openid:event.persionOpenid}).orderBy("dynamic.time", "desc").skip(page).limit(num).get()
  }
}