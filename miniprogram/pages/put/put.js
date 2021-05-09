// miniprogram/pages/put/put.js
var util = require('../../utils/util.js');
var arrList = [];
const app = getApp()
const db = wx.cloud.database()
var filePath = [];
var strOk = 0;
var imgOk = 0;
Page({
  data: {
    searchinput: '',
    index: null,
    img_arr: [],
    dynamic: {
      author: {
        ifStudent: '',
        avatarPic: '',
        name: '',
        sex: '',
        grade: '',
        place: '',
      },
      inputData: '',
      imgList: [],
      praise: 0,
      praiserId: [],
      comment: [],
      time: ''
    }
  },

  //生命周期函数--监听页面加载！！！！！！！！！！！！！！
  onLoad: function (options) {
    //调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      console.log("获取到openid:", res.result.openid);
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        app.globalData = res.data[0]
        this.setData({
          "dynamic.author": app.globalData.userinfo,
        })
      })
    });
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
  //图片取buffer
  async qubuffer(media) {
    //console.log("图片路径",media)
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: media,
        success: res => {
          resolve(res.data)
        }
      })
    })
  },
  //图片压缩
  async yasuo(media, size, xxx) {
    //media=media.replace("wxfile","https")
    console.log("要压缩的地址", media)
    return new Promise((resolve, reject) => {
      //这是压缩式要用的获取宽高
      wx.getImageInfo({
        src: media,
        success(res) {
          console.log("getImageInfo------>", res)
          var width = res.width//原图宽
          var height = res.height//原图高
          var xx = xxx//最后应该设置的宽
          var yy = Math.trunc(xxx * height / width)//最后应该设置的高
          var huabu = wx.createCanvasContext("huabu", this)
          huabu.drawImage(media, 0, 0, xx, yy);
          huabu.draw(true, setTimeout(function () {
            wx.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: xx,
              height: yy,
              destWidth: xx,
              destHeight: yy,
              canvasId: 'huabu',
              fileType: 'jpg',
              quality: size,//压缩质量0-1默认0.92
              success(es) {
                console.log('压缩完了', es.tempFilePath)
                resolve(es.tempFilePath)
              }
            }, this);
          }, 500))
        }
      })
    })
  },
  //图片取大小
  async qudaxiao(media) {

    return new Promise((resolve, reject) => {
      wx.getFileInfo({
        filePath: media,
        success(res) {
          console.log("图片的", res)
          resolve(res.size)
        }
      })
    })
  },

  //开始审核文本
  async checkText() {
    var text = this.data.dynamic.inputData
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
        "dynamic.imgList": [],
        "dynamic.inputData": '',
        inputData: '',
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
    var img = this.data.dynamic.imgList//图片临时路径赋值给变量img
    //开始图片审核
    if (img.length != 0) {
      console.log("看看图片路径是什么", this.data.dynamic.imgList)
      //审核图片
      wx.showLoading({
        title: '图片处理...',
        mask: true
      })
      var media = ''
      for (var i = 0; i < img.length; i++) {
        media = img[i]
        // var size = await this.qudaxiao(media)
        // console.log("图片的大小是", size)
        // if(size>=51200){
        //   media=await this.yasuo(media,0.6,300)
        // }

        // // //验证压缩后大小
        // // var size=await this.qudaxiao(media)
        // console.log("压缩完图片的大小是", size)
        // media = await this.qubuffer(media)
        let checkOk = await this.checkImg(media)//开始审核图片
        if (checkOk == 87014 || checkOk == -604102) {
          wx.hideLoading({}),//审核不通过隐藏
            wx.showToast({
              title: '图片检测出现问题',
              icon: 'none',
              duration: 2000,
            })
          this.setData({
            "dynamic.imgList": []
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
            "dynamic.imgList": []
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
  //上传数据
  async pushdynamicData() {
    var strOK = await this.checkText();
    var imgOK = await this.checkimages();

    if (strOK && imgOK) {
      wx.showLoading({
        title: '发布中...',
      })
      db.collection('dynamic').add({
        data: {
          dynamic: {
            author: this.data.dynamic.author,
            inputData: this.data.dynamic.inputData,
            imgList: this.data.dynamic.imgList,
            praise: this.data.dynamic.praise,
            praiserId: this.data.dynamic.praiserId,
            comment: this.data.dynamic.comment,
            time: new Date().getTime()
          }
        },
      })
        .then(res => {
          filePath = [];
          arrList = [];
          this.setData({
            "dynamic.imgList": [],
            "dynamic.inputData": '',
            searchinput: ''
          })
          wx.switchTab({
            url: '/pages/index/index'
          })
          wx.hideLoading({
            success: (res) => {},
          })
        })
    }
  },
  //上传按钮
  formSubmit: function (e) {
    this.pushdynamicData();
  },


  ChooseImage() {
    wx.chooseImage({
      count: 9, //默认9
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['camera', 'album'], //从相册选择

      success: (res) => {
        filePath = res.tempFilePaths
        filePath.forEach((item, idx) => {
          var fileName = Date.now() + "_" + idx;
          this.cloudFile(fileName, item)
        })

      }
    });
  },


  cloudFile(fileName, path) {
    wx.showLoading({
      title: '图片上传中',
    })
    wx.cloud.uploadFile({
      cloudPath: "dynamicPic/" + fileName + ".jpg",
      filePath: path
    }).then(res => {

      arrList.push(res.fileID);
      this.setData({
        "dynamic.imgList": arrList,
      })
      wx.hideLoading({
        success: (res) => { },
      })
    })
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.dynamic.imgList,
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
          this.data.dynamic.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            "dynamic.imgList": this.data.dynamic.imgList
          })
        }
      }
    })
  },

  //获取文字输入框内容
  textareaAInput: function (e) {
    this.setData({
      "dynamic.inputData": e.detail.value
    });
  },
})