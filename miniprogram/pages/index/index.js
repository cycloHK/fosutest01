//index.js
const db = wx.cloud.database()
const app = getApp()
var listLenFind = 0;//记录"发现"页面列表长度
var listLenHot = 0;//记录"热榜"页面列表长度
var login = true;
Page({
  data: {
    love: false,
    kong: false,
    userId: '',
    index: 0,
    connent: [],
    hot: [],
    current: '0',
    winWidth: 0,
    winHeight: 0,
    praiseNow: "praise",
    PageCur: 'square',
    TabCur: 0,
    tabNav: ['发现', '热榜'],
    cardCur: 0,
    swiperList: [],
  },

  onLoad(options) {
    this.setData({
      connent: []
    })
    this.loadData(7, 0);
    console.log("onload被执行")
    this.getSwiperList();
    this.getUserId();
  },

  onShow: function () {
    console.log("onshow被执行")

  },
  onReady: function () {
    console.log("onready被执行")
  },
  onPullDownRefresh: function () {
    if (this.data.TabCur == 0) {
      this.setData({
        connent: []
      })
      this.loadData(7, 0);
    }
    if (this.data.TabCur == 1) {
      this.setData({
        hot: []
      })
      this.loadHotData(7, 0);
    }
    wx.stopPullDownRefresh({})
    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 800
    })
  },
  onReachBottom: function () {
    if (this.data.TabCur == 0) {
      var page = this.data.connent.length;
      if (listLenFind != page) {
        this.loadData(7, page)
      }
      else {
        wx.showToast({
          title: '没有更多了哦',
          icon: 'none'
        })
      }
    }
    if (this.data.TabCur == 1) {
      var page = this.data.hot.length
      if (listLenHot != page) {
        this.loadHotData(7, page)
      }
      else {
        wx.showToast({
          title: '没有更多了哦',
          icon: 'none'
        })
      }
    }
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
          "userData.userinfo.name": res.userInfo.nickName,
          "userData.userinfo.avatarPic": res.userInfo.avatarUrl,
          avatarPic: res.userInfo.avatarUrl,
          "userData.userinfo.sex": (res.userInfo.gender ? '男' : '女'),
        })
      }
    })
  },
  //获取用户_id
  getUserId() {
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        if (res.data.length == 0) {
          login = false;
        }
        else {
          this.setData({
            userId: res.data[0]._id,
          })
        }
      })
    });
  },
  //获取轮播图数据
  getSwiperList() {
    db.collection('system').doc('cbddf0af60881cf4041f01b615d89c5a')
      .get()
      .then((res) => {
        this.setData({
          swiperList: res.data.swiperList
        })
        console.log(this.data.swiperList)
      })
  },
  //读取数据库中动态的数据
  loadData(num = 7, page = 0) {
    wx.cloud.callFunction({
      name: 'getIndexData',
      data: {
        num: num,
        plate: 1,
        page: page
      }
    }).then(res => {
      var oldData = this.data.connent;
      var newData = oldData.concat(res.result.data);
      listLenFind = oldData.length;
      this.setData({
        connent: newData
      })
      this.getPraise();
    })

  },
  loadHotData(num = 7, page = 0) {
    wx.cloud.callFunction({
      name: 'getIndexData',
      data: {
        num: num,
        plate: 2,
        page: page
      }
    }).then(res => {
      var oldData = this.data.hot;
      var newData = oldData.concat(res.result.data);
      listLenHot = oldData.length;
      this.setData({
        hot: newData
      })
      this.getHotPraise();
    })
  },
  //加载发现点赞数据
  async getPraise() {
    var dataWithPraise = await this.love(this.data.connent)
    this.setData({
      connent: dataWithPraise
    })
    console.log("squarelove", this.data.connent)
  },
  //加载热榜点赞数据
  async getHotPraise() {
    var dataWithPraise = await this.love(this.data.hot)
    this.setData({
      hot: dataWithPraise
    })
  },
 //添加点赞标记
 async love(e) {
  var l = e.length
  for (var i = 0; i < l; i++) {
    console.log('e=',e)
    //var yn = e[i].dynamic.praiserId.indexOf(this.data.userId)
    //这个页面修改的地方（1）：
    var yn = e[i].dynamic.praiserId.indexOf(app.globalData.openid)
    if (yn == -1) {
      e[i].love = false
    } else {
      e[i].love = true
    }
  }
  return e
},


  //点赞更新数据库
  dianzan(e) {
    console.log("点了")
    //var _id = this.data.userId
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    this.showPraise(index);
    wx.cloud.callFunction({
      name: "praise",
      data: {
        id: id,
        dzrid: app.globalData.openid 
      }
    })
  },
  //点赞状态改变
  showPraise(index) {
    if (this.data.TabCur == 0) {
      var connent = this.data.connent
      if (this.data.connent[index].love) {
        connent[index].love = false
        connent[index].dynamic.praise--
      } else {
        connent[index].love = true
        connent[index].dynamic.praise++
      }
      this.setData({
        connent: connent,
      })
    }

    if (this.data.TabCur == 1) {
      var hot = this.data.hot
      if (this.data.hot[index].love) {
        hot[index].love = false
        hot[index].dynamic.praise--
      } else {
        hot[index].love = true
        hot[index].dynamic.praise++
      }
      this.setData({
        hot: hot,
      })
    }
  },


  //轮播图点的状态
  DotStyle(e) {
    this.setData({
      DotStyle: e.detail.value
    })
  },

  //顶部导航栏Tab切换
  cardSwiper(e) {
    this.setData({
      cardCur: e.detail.current
    })
  },
  tabSelect(e) {
    this.loadHotData();
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1) * 60
    })
  },

  //进入详情页
  inDetail: function (e) {
    console.log("跳转至详情页携带数据", e)
    var love = e.currentTarget.dataset.index
    wx.navigateTo({
      url: '../detailPage/detailPage?id=' + e.currentTarget.dataset.id + '&love=' + love + '&openid=' + e.currentTarget.dataset.openid,
    })
  },
  inPersonPage: function (e) {
    console.log("进入个人主页")
    console.log("该用户的openid", e.currentTarget.dataset.openid)
    wx.navigateTo({
      url: '../personPage/personPage?openid=' + e.currentTarget.dataset.openid,
    })
  }
});