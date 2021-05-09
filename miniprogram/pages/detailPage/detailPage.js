// miniprogram/pages/detailPage/detailPage.js

const db = wx.cloud.database()
const _ = db.command
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    love:true,
    commenterOpenid: '',
    commenterid:'',
    commenter: {},
    authorOpenid:'',
    id: 0,
    content: [],
    inputData:'',
    searchinput:'',
  },
  /** 
  * 预览图片
  */
 
  previewImage: function (e) {
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current, // 当前显示图片的http链接
      urls: this.data.content.dynamic.imgList // 需要预览的图片http链接列表
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that=this;
    if(options.love=='true')
    {
      that.setData({
        love:true
      })
    }
    else{
      that.setData({
        love:false
      })
    }
 
    this.data.id = options.id
    this.data.authorOpenid=options.openid
    this.getDetailData();
    //获取评论者信息
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
     this.data.commenterOpenid=res.result.openid
     console.log("commenterOpenid=====",this.data.commenterOpenid)
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
          this.data.commenter=res.data[0].userinfo;
          this.data.commenterid=res.data[0]._id
      })
    });
  },
 //加载详情页信息
  getDetailData() {
    db.collection("dynamic").doc(this.data.id).get().then((res) => {
      this.setData({
        content: res.data,
      })
    })
  },
  /**
  * 生命周期函数--监听页面显示
  */
  onShow: function () {
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getDetailData();
    wx.stopPullDownRefresh({})
        wx.showToast({
          title: '刷新成功',
          icon: 'none',
          duration: 800
        })
  },
  
  //点赞帖子
  dianzan(e){
    var id=this.data.commenterid
     var ssid=this.data.content._id
    wx.cloud.callFunction({
      name:"praise",
      data:{
        id:ssid,
        dzrid:id//点赞人id
      }
    })
    var ss_xx=this.data.content
    if(this.data.love){
      ss_xx.dynamic.praise--
      this.setData({
        love:false,
        content:ss_xx
      })
    }else{
      ss_xx.dynamic.praise++
      this.setData({
        love:true,
        content:ss_xx
      })
    }
  },
  //文字输入框内容
  textareaAInput: function (e) {
    var inputData = e.detail.value;
    this.setData({
     inputData: inputData
    });
  },
  formSubmit: function (e) {
    if(this.data.inputData=='')
    {
     wx.showToast({
       title: '回复不能为空',
       icon:'none'
     })
    }
    else{
      this.pushdynamicData();
    }
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
   //开始审核文本
   async checkText() {
    var text = this.data.inputData
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
      this.setData({
        inputData: '',
        searchinput: ''
      })
      return false//这个return返回，停止继续执行
    }
    else {
      return true
    }
  },
  //上传数据
 async pushdynamicData() {
    var strOK = await this.checkText();
    if(strOK)
    {
      wx.showLoading({
        title: '发送中...',
      })
      db.collection("dynamic").where({
        _id: this.data.id
      })
        .update({
          data: {
            dynamic: {
              comment: _.unshift([{
                avatarPic: this.data.commenter.avatarPic,
                content: this.data.inputData,
                grade: this.data.commenter.grade,
                name: this.data.commenter.name,
                place: this.data.commenter.place,
                openid:this.data.commenterOpenid,
                time: new Date().getTime()
              }]),
            }
          },
        })
        .then(res => {
          this.setData({
            searchinput:'',
            inputData:''
          })
          this.getDetailData();
          wx.hideLoading({})
        })
    }
   
  },
  warning(){

  },
  //进入楼主主页
  inPersonPage: function (e){
    wx.navigateTo({
      url: '../personPage/personPage?openid='+this.data.authorOpenid,
    })
  },
  //进入评论者主页
  inPersonPage1(e){
   console.log("进入评论者主页",e.currentTarget.dataset.openid)
    wx.navigateTo({
      url: '../personPage/personPage?openid=' +e.currentTarget.dataset.openid,
    })
  }
})