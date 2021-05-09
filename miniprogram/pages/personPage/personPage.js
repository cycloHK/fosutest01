// miniprogram/pages/personPage/personPage.js
const db = wx.cloud.database();
var listLenFind = 0;
Page({

  
  data: {
    userinfo: {},
    persionOpenid:"",
    historyDymaic:[]
  },

 
  onLoad: function (options) {
    this.setData({
      persionOpenid:options.openid
    })
    console.log('个人主页接受到openid',options.openid)
    this.getUserInfo();
    this.getHistoryDymaic();
  },
  onReady: function () {

  },

 
  onShow: function () {

  },

  onHide: function () {

  },
  onUnload: function () {

  },
  onPullDownRefresh: function () {
    this.setData({
      historyDymaic:[]
    })
    this.getHistoryDymaic(6,0);
    wx.stopPullDownRefresh({})
    wx.showToast({
      title: '刷新成功',
      icon: 'none',
      duration: 800
    })
  },

  onReachBottom: function () {
    var page = this.data.historyDymaic.length;
    if (listLenFind != page) {
      this.getHistoryDymaic(6, page)
    }
    else {
      wx.showToast({
        title: '没有更多了哦',
        icon: 'none'
      })
    }
  },

  onShareAppMessage: function () {

  },
  getUserInfo(){
    db.collection("usersInfformation").where({
      _openid:this.data.persionOpenid
    }).get()
    .then(res=>{
      this.setData({
        userinfo:res.data[0]
      })
      console.log("获取到个人信息",this.data.userinfo)
    })
  },
  getHistoryDymaic(num =6, page = 0){
    wx.cloud.callFunction({
      name: 'getIndexData',
      data: {
        num: num,
        plate: 4,
        page: page,
        persionOpenid:this.data.persionOpenid
      }
    })
    .then(res=>{
      console.log("res",res)
      var oldData = this.data.historyDymaic;
      var newData = oldData.concat(res.result.data);
      listLenFind = oldData.length;
      this.setData({
        historyDymaic: newData
      })
     
    })
  },
  //进入详情页
  inDetail: function (e) {
    console.log("跳转至详情页携带数据",e)
    var love = e.currentTarget.dataset.index
    wx.navigateTo({
      url: '../detailPage/detailPage?id=' + e.currentTarget.dataset.id + '&love=' + love + '&openid=' + e.currentTarget.dataset.openid,
    })
  },

  
})