// miniprogram/pages/mine/mine.js
const { $Message } = require('../../dist/base/index');
const app = getApp()
const db = wx.cloud.database()
var arrList = [];
var login=true;
Page({
  data: {
    signature:'',
    imgList: [],
    index: null,
    winWidth: 0,
    winHeight: 0,
    userinfo: {},
    hiddenmodalput: true,
    showModal: true,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    preAvatarPic: '',
    index: null,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

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
        console.log("res.data",res.data)
        if (res.data.length == 0) {
         login=false;
         console.log("看看登陆状态",login)
        }
        else{
          login=true;
          this.getUserInfo();
        }
      })
    });
  },

  //生命周期函数--监听页面加载！！！！！！！！！！！！！！
  onLoad: function (options) {
    this.getUserId();
  },
  getUserInfo() {
    //调用云函数登录
      wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      console.log("获取到openid:", res.result.openid);
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        console.log("res.data=", res.data[0])
        if(login)
        {
          this.setData({
            userinfo: res.data[0].userinfo,
            signature:res.data[0].signature,
          })
        }
      })
    });
  },
  /**
 * 页面相关事件处理函数--监听用户下拉动作
 */
  onPullDownRefresh: function () {
    console.log('监听用户下拉动作')
    this.getUserInfo();
    wx.stopPullDownRefresh({})
    wx.showToast({
      title: '已刷新',
      icon: 'none',
      duration: 800
    })

  },
  /**
  * 生命周期函数--监听页面显示
  */
  onShow: function () {

  },

  infoPage: function () {
    wx.navigateTo({
      url: '/pages/mine/setting/setting',
    })
  },
  historyPage: function () {
    wx.navigateTo({
      url: '/pages/mine/history/history',
    })
  },
  aboutUsPage: function () {
    wx.navigateTo({
      url: '/pages/mine/aboutUs/aboutUs',
    })
  },
  sharePage: function () {
    wx.navigateTo({
      url: '/pages/mine/share/share',
    })
  },

  //文本内容合法性检测
  async checkStr(text) {
    try {
      var res = await wx.cloud.callFunction({
        name: 'checkStr',
        data: {
          text: text,
        }
      });
      console.log("云检测结果", res.result);
      if (res.result.errCode == 0)
        return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  },
  //图片内容合法性检测
  async checkImg(media) {
    console.log("要检测的buffer", media)
    try {
      var res = await wx.cloud.callFunction({
        name: 'checkImg',
        data: { media }
      });
      console.log("云检测结果", res.result);
      return res.result.errCode
    } catch (err) {
      console.log("云检测错误", err);
      return 1;
    }
  },
   //开始审核文本
   async checkText() {
    var text = this.data.signature
    if (text.length > 0) {
      var checkOk = await this.checkStr(text);
    } else {
      var checkOk = true
    }
    if (!checkOk) {

      wx.hideLoading({}),//审核不通过隐藏
        wx.showToast({
          title: '文本含有违法违规内容',
          icon: 'none',
          duration: 5000,
        })
      filePath = [];
      arrList = [];
      this.setData({
        signature: '',
        searchinput: ''
      })
      return false//这个return返回，停止继续执行
    }
    else {
      return true
    }
  },
  //开始审核图片
  async checkimages() {
    var img = this.data.imgList//图片临时路径赋值给变量img
    //开始图片审核
    if (img.length != 0) {
      //审核图片
      wx.showLoading({
        title: '图片处理...',
        mask: true
      })
      var media = ''
      for (var i = 0; i < img.length; i++) {
        media = img[i]
        let checkOk = await this.checkImg(media)//开始审核图片
        if (checkOk == 87014 || checkOk == -604102) {
          wx.hideLoading({}),//审核不通过隐藏
            wx.showToast({
              title: '图片检测出现问题',
              icon: 'none',
              duration: 2000,
            })
          this.setData({
            imgList: []
          })
          return false
        } else if (checkOk != 0) {
          wx.hideLoading({}),//审核不通过隐藏
            connectIsOK = false;
          wx.showToast({
            title: '图片检测出现问题',
            icon: 'none',
            duration: 2000,
          })
          this.setData({
            imgList: []
          })
          return false
        }
        else {
          return true
        }
      }
      wx.hideLoading({})
    }
    else {
      return true
    }
  },
  //上传认证图片
  ChooseImage() {
    wx.chooseImage({
      count: 2, //默认9
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album'], //从相册选择
      success: (res) => {
        var filePath = res.tempFilePaths
        filePath.forEach((item, idx) => {
          var fileName = Date.now() + "_" + idx;
          this.cloudFileIfStudent(fileName, item)
        })
      }
    });
  },
  cloudFileIfStudent(fileName, path) {
    wx.showLoading({
      title: '图片加载中',
    })
    wx.cloud.uploadFile({
      cloudPath: "ifStudent/" + fileName + ".jpg",
      filePath: path
    }).then(res => {
      arrList.push(res.fileID);
      this.setData({
        imgList: arrList,
        "userinfo.ifStudent": '认证中',
      })
      wx.hideLoading({})
    })

  },
 async upIfStudentData() {
    //上传修改数据
    var imgOK = await this.checkimages();
    if(imgOK)
    {
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then((res) => {
        db.collection("usersInfformation").where({
          _openid: res.result.openid
        }).update({
          data: {
            imgList: this.data.imgList,
            userinfo: {
              ifStudent: this.data.userinfo.ifStudent
            },
          }
        }).then((res) => {
          arrList=[];
          this.setData({
            imgList:[]
          })
        })
      });
  
      wx.showToast({
        title: '上传成功！',
        duration: 2000
      });
    }
    
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  DelImg(e) {
    wx.showModal({
      title: '召唤师',
      content: '确定要删除这张图片吗？',
      cancelText: '再看看',
      confirmText: '再见',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },
  upButton: function () {
    if(login)
    {
      this.upIfStudentData();
    }
    else
    {
      login=true;
      wx.navigateTo({
        url: '../login/login?loud='+"mine",
      })
    }
  },
  //修改签名
  setSignature: function () {
    this.setData({
      hiddenmodalput: false
    })
  },
  cancelM: function (e) {
    this.setData({
      hiddenmodalput: true,
    })
  },
  async confirmM (e) {
    var strOK = await this.checkText();
    if(strOK)
    {
      wx.showLoading({
        title: '上传中...',
      })
      //上传修改数据
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).update({
        data: {
          signature:this.data.signature
        }
      }).then((res) => {
        wx.hideLoading({})
    wx.showToast({
      title: '已修改！',
      duration: 500
    });
      })
    });
    }
   
    this.setData({
      hiddenmodalput: true
    })
  },
   iName (e) {
    this.setData({
     signature: e.detail.value
    })
  },

});