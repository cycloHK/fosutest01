// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {

 // const wxContext = cloud.getWXContext()
  // let myCourseData = await db.collection('myCourse')
  // .where({
  //  openid: wxContext.OPENID,
  //  myClass: event.myClass,
  //  term: event.term
  // })
  // .get()
  let courses=[]
  let beizhu=""
  
  // if(myCourseData.data.length > 0){
  //   courses=myCourseData.data[0].coursesList
  //   beizhu=myCourseData.data[0].beizhu
  // }else{
    let d = await db.collection('courses').where({
      'class': event.myClass,
      'term':  event.term
    })
    .get()
    courses=d.data
 // }
  
  return {
    data: courses,
    beizhu
  }
}