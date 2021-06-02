// pages/login/login.js

const app = getApp()
const db = wx.cloud.database()
var path="";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarPic:'',
    userData: {},
  },
  onLoad: function (options) {
  console.log("options",options)
  path=options.loud;
   this.setData({
    userData:app.globalData
   })
  },
  backToIndex(){
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  //获取用户微信信息
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          "userData.userinfo.name":res.userInfo.nickName,
          "userData.userinfo.avatarPic":res.userInfo.avatarUrl,
          avatarPic:res.userInfo.avatarUrl,
         "userData.userinfo.sex":(res.userInfo.gender? '男':'女'),
        })
        this.pushUserInfoData();
      }
    })
  },

   //上传数据
   pushUserInfoData()
   {
     db.collection('usersInfformation').add({
       data:{
         userinfo: {
           ifStudent:this.data.userData.userinfo.ifStudent,
           avatarPic:this.data.avatarPic,
           name:this.data.userData.userinfo.name,
           sex:this.data.userData.userinfo.sex,
           grade:this.data.myGrade,
           department:this.data.myDepartment,
           class:this.data.myClass,
           place:this.data.userData.userinfo.place,
         },
         signature:this.data.userData.signature,
         imgList:this.data.userData.imgList,
         iflogin:this.data.iflogin,
         dynamic:this.data.userData.dynamic,
         loginTime:new Date(),
       },
     })
     .then(res => {
      wx.showToast({
        title: '注册成功！',
        duration: 3000
      });
     })
     if(path=="put")
     {
      wx.switchTab({
        url: '/pages/put/put?login='+true
      })
     }
     if(path=="mine")
     {
      wx.switchTab({
        url: '/pages/mine/mine?login='+true
      })
     }
     if(path=="setting")
     {
      wx.navigateBack({
        delta: 0,
      })
     }
     if(path=="detailPage")
     {
       wx.navigateBack({
         delta: 0,
       })
     }
   },

  /**
   * 生命周期函数--监听页面加载
   */
 

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})