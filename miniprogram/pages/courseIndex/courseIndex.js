const app = getApp()
const db = wx.cloud.database()
let todayCourseList=[]
let today = new Date();


//测试用to-my-info



//获取课程
async function getMyCourse(myClass, term, flush) {
  console.log("开始获取课程")                      
 // console.log(app.globalData.allCourseData)
  if(!app.globalData.allCourseData){
    app.globalData.allCourseData={}
  }
  if (!app.globalData.beizhu) {
    app.globalData.beizhu = {}
  }
  let coursesList = [];//当前所选学期课程数据
  let courseKey = myClass + '-' + term
  const res = wx.getStorageInfoSync()
  console.log(res)
  let beizhu = ''
  if (flush) {
    //刷新数据
    //刷新数据
    let dataObj
    dataObj = await getCourse(myClass, term);
    
    coursesList = dataObj.coursesList
    beizhu = dataObj.beizhu
    app.globalData.beizhu[courseKey + 'bz']=beizhu
    app.globalData.allCourseData[courseKey] = coursesList;
    return coursesList;
  } else {
    //内存中没有数据时
    if (!app.globalData.allCourseData.hasOwnProperty(courseKey)) {
      //从缓存获取
      let dataObj
      dataObj = await getCourseStorage(courseKey);  
      if (dataObj.coursesList.length == 0) {
        //缓存没有数据时   
        dataObj = await getCourse(myClass, term);
        console.log("缓存没有数据时，获取数据:",dataObj)
      }
      coursesList = dataObj.coursesList
      beizhu = dataObj.beizhu
     // console.log('coursesList:',coursesList)
      app.globalData.allCourseData[courseKey] = coursesList;
      app.globalData.beizhu[courseKey + 'bz']=beizhu
      return coursesList;
    } else {
      return app.globalData.allCourseData[courseKey];
    }
  }
}
/**
 * 从缓存读取课表
 */
async function getCourseStorage(courseKey) {
  let coursesList = [];
  await wx.getStorage({
    key: courseKey
  }).then(res => {
    console.log('从缓存成功读取课表' + courseKey)
    coursesList = res.data;
  }).catch(err => {
    console.log('获取缓存失败')
    console.log(err)
  })
  var beizhu = wx.getStorageSync(courseKey + 'bz')
  return {
    coursesList,
    beizhu
  }
}
/**
 * 从数据库获取课表,并写入缓存
 */

async function getCourse(myClass, term) {
  
  let courseKey = myClass + '-' + term
  let coursesList = []
  let beizhu = ''
  //let mySkip =0

  
  let getDbCount = await db.collection('courses').where({
    'class': myClass,
     'term': term 
  }).count()
 
  for (let i = 0; i < getDbCount.total ; i += 20)
  {
    let dbCouse = await db.collection('courses')
  .where({
    'class': myClass,
    'term': term 
  }).skip(i)
  .get()
 // coursesList = dbCouse.data

for (let j = 0; j < dbCouse.data.length;j++){
    coursesList.push(dbCouse.data[j])
  }

  }
  
  console.log('检查传入数据库查询字段myClass',myClass,term)
  await wx.cloud.callFunction({
    name: 'getCourse',
     data: {
      myClass,
       term
     }
  }).then(res => {
   coursesList = setCourseColor(res.result.data);
    beizhu = res.result.beizhu
    wx.setStorage({
      key: courseKey,
      data: coursesList,
      success: res => {
        console.log(res)
      },
      fail: err => {
        console.log(err)
      },
    })
    wx.setStorage({
      key: courseKey + 'bz',
      data: beizhu,
      success: res => {
        console.log(res)
      },
      fail: err => {
        console.log(err)
      },
    })
  }).catch(res => {
      //console.log(res)
    })
  return {
    coursesList,
    beizhu
  }
}


function setCourseColor(coursesList) {
  /**
   * 识别同名课，设定同颜色；
   */
  let courseColor = {};
  let colorNum = 0;
  for (let i = 0; i < coursesList.length; i++) {
    let course = coursesList[i];
    if (!courseColor.hasOwnProperty(course.name)) {
      courseColor[course.name] = colorNum;
      colorNum++;
    }
    coursesList[i].color = courseColor[course.name];
  }
  // console.log(coursesList);
  return coursesList;
}

function checkWeek(weeks, beginWeek, endWeek) {
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i] >= beginWeek && weeks[i] <= endWeek) {
      return true;
    }
  }
  return false;
}

//获取当前学期的周数
async function getCurrentWeek(termStr){
  let date = today;
  let currentWeek=-1
  //在数据库获取学期开始时间
  await db.collection('system')
  .doc('dateStartId123')
  .get().then(res => {
    // res.data 包含该记录的数据
    let dateStart = new Date(res.data.dateStart); 
    currentWeek = Math.floor((date - dateStart) / (1000 * 60 * 60 * 24) / 7 + 1);
    console.log('currentWeek',currentWeek);
  })
  return currentWeek;  
}

async function getTodayCourse(myClass,term){
  let status=true


  if(!app.globalData.currentWeek){
    app.globalData.currentWeek=await getCurrentWeek(term);   //如果没有week则获取
  }
  let currentWeek=app.globalData.currentWeek;

  if(todayCourseList.length==0||todayCourseList[0].class!=myClass){
   console.log('获取今日课表')
    let day=today.getDay();
    //console.log('day------>',day)
    //day=5   //需要删除该语句
    if(day==0){
      day=7;           //可能修改星期日
    }
    // if(!app.globalData.currentWeek){
    //   app.globalData.currentWeek=await getCurrentWeek(term);   //如果没有week则获取
    // }
    // let currentWeek=app.globalData.currentWeek;
    let coursesList=await getMyCourse(myClass,term,false);
    let todayCourse=[];
    if(coursesList.length==0){
      status=false;
    }
    for(let n=0;n<coursesList.length;n++){
      if(coursesList[n].day==day){      
        todayCourse.push(coursesList[n]);
      }
    }
    let courseObject={}
    let list=[]
    for(let i=0;i<todayCourse.length;i++){
      if(todayCourse[i].name.indexOf("大学体育")!=-1){
        console.log(todayCourse[i].name)
        todayCourse[i].name="大学体育";
        todayCourse[i].teacher="体育老师";
        todayCourse[i].place="按照体育老师安排";
      }
      if(!courseObject.hasOwnProperty(todayCourse[i].name+todayCourse[i].beginTime)
      &&checkWeek(todayCourse[i].weeksNum,currentWeek,currentWeek)){
        list.push(todayCourse[i]);
        courseObject[todayCourse[i].name+todayCourse[i].beginTime]=1;
      }
    }
    list.sort(function(a, b){return a.beginTime - b.beginTime});
    todayCourseList=list;
  }
  
  console.log("todayCourseList:",todayCourseList)
  console.log("函数内：",app.globalData.currentWeek)
  return {
    todayCourseList:todayCourseList,
    status:status,
    currentWeek:app.globalData.currentWeek
  }
}
//获取现在的学期
function getcurrentTerm(){
  let date = today;
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  // let d=date.getDate();
  let currentTerm
  if (month < 9) {
    //第二学期
    currentTerm=(year-1)+'-'+year+'-'+2
  }else(
    currentTerm=year+'-'+(year+1)+'-'+1
  )
  return currentTerm;
}

//正常执行 获取班级信息 18工业工程1 return => myClass
async function getUserClass(){
  if(!app.globalData.myClass){
    
    await wx.cloud.callFunction({
      name: 'getUserInfo'
    }).then(res => {
      let info = res.result.info
      if (info && info.length > 0) {
        app.globalData.myClass=info[0].myClass
        //console.log('初始化班级在这里',app.globalData.myClass)  //可以获取班级信息
      }
    }).catch(res => {
      console.log(res)
    })
  }
  return app.globalData.myClass;
}
let todayWeek=today.getDay();
if(todayWeek==0){
  todayWeek=7;
}

Page({
  data: {
    todayWeek:todayWeek,
    showHeader:true,
    showTip:false,
    showApp:false,
    tipStr:'今天没课，去看看完整课表吧',
    currentWeek:'',
    myClass: '',
    courseData: [],
    /*默认加载的indexlist数据*/
    indexlist: [],
    days: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    time: [
      ['08:00', '08:40'],
      ['08:45', '09:25'],
      ['09:40', '10:20'],
      ['10:25', '11:05'],
      ['11:10', '11:50'],
      ['13:30', '14:10'],
      ['14:15', '14:55'],
      ['15:10', '15:50'],
      ['15:55', '16:35'],
      ['16:40', '17:20'],
      ['18:30', '19:10'],
      ['19:15', '19:55'],
      ['20:05', '20:45'],
      ['20:50', '21:30'],
    ]
  },

  toMyInfo(e){
    console.log("准备跳转")
    wx.navigateTo({
      url: '/pages/my-info/my-info'
    })
  },

  onLoad: function (query) {

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let tipStr='今天没课，去看看完整课表吧'
    let that=this
    getUserClass().then(res=>{
      that.setData({
        myClass: res
      })
      if(!res){
        res='abc'
      }
      getTodayCourse(res,getcurrentTerm()).then(res=>{
        // this.setData({
        //   todayCourseList:tres.todayCourseList,
        //         status:status,
        //         currentWeek:app.globalData.currentWeek
        // }) 

        if(!res.status){
          tipStr='暂无您的班级课程数据'
        }
        let currentWeek='第'+res.currentWeek+'周'   

        console.log("测试undefined----->",currentWeek)

        if(res.currentWeek>19||res.currentWeek<1){
          tipStr='放假中...'
          currentWeek=''
        }
        console.log("+++++测试undefined>",currentWeek)
        console.log('TodayCourse:',res)
        that.setData({
          showTip:true,
          courseData:res.todayCourseList,
          tipStr,
          currentWeek         //undefine 的问题应该在这
        })
      }).catch(e=>{
        console.log(e)
        that.setData({
          showTip:true
        })
        wx.showToast({
          title: '网络异常',
          icon: 'none',
          duration: 1000
        })
      })
    }).catch(e=>{
      console.log(e)
      that.setData({
        showTip:true
      })
      wx.showToast({
        title: '网络异常',
        icon: 'none',
        duration: 1000
      })
    })
  },
  onHide: function () {
    this.setData({
      showTip:false
    })
  },
  onShareAppMessage: function () {
  
  }
})
