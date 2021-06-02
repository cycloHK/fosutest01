// miniprogram/pages/detailPage/detailPage.js

const db = wx.cloud.database()
const _ = db.command
const app = getApp()
var login = true;
 //评论下标
 var commentListIndex=null;
 var comment={};
 var commentListLen = 0
Page({

  /**
   * 页面的初始数据
   */
  data: {
    openClose:false,
    placeholder:"写下你善意的回复",
    love: true,
    commenterOpenid: '',
    commenterid: '',
    commentList:[],
    commenter: {},
    toCommenter:{},
    authorOpenid: '',
    id: 0,
    content: [],
    inputData: '',
    searchinput: '',
  },

  onLoad: function (options) {
    this.getCommenter();
    this.getUserId();
    var that = this;
    if (options.love == 'true') {
      that.setData({
        love: true
      })
    }
    else {
      that.setData({
        love: false
      })
    }
    this.data.id = options.id
    this.data.authorOpenid = options.openid
    this.getDetailData();

  },
  onShow: function () {
    this.getCommenter();
  },

  onPullDownRefresh: function () {
    this.getDetailData();
    wx.stopPullDownRefresh({})
    wx.showToast({
      title: '刷新成功',
      icon: 'none',
      duration: 800
    })
  },

  //预览图片
  previewImage: function (e) {
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current, // 当前显示图片的http链接
      urls: this.data.content.dynamic.imgList // 需要预览的图片http链接列表
    })
  },
  getCommenter() {
    //获取评论者信息
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      this.setData({
        commenterOpenid:res.result.openid
      })
      console.log("commenterOpenid=====", this.data.commenterOpenid)
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        if (login) {
          this.setData({
            commenter :res.data[0].userinfo,
            commenterid :res.data[0]._id
          })
          console.log("评论者信息commenter",this.data.commenter)
        }

      })
    });
  },
  //获取用户_id
  async getUserId() {
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        console.log("res.data", res.data)
        if (res.data.length == 0) {
          login = false;
          console.log("看看登陆状态", login)
        }
        else {
          login = true;
        }
      })
    });
  },
  //加载详情页信息
  getDetailData() {
    db.collection("dynamic").doc(this.data.id).get().then((res) => {
      console.log("res.data------>",res.data)
      this.setData({
        content: res.data,
      })
      this.setOpen();
    })
  },
  
  //点赞帖子
  dianzan(e){
     var ssid=this.data.content._id //当前动态的id
    wx.cloud.callFunction({
      name:"praise",
      data:{
        id:ssid,
        //dzrid:id//点赞人id
        //这个文件需要修改的地方：
        dzrid:app.globalData.openid //用户openid作点赞人id，存入的是用户openid
      }
    })
    var ss_xx=this.data.content
    console.log("看看love是什么",this.data)
    console.log("点赞前",ss_xx.dynamic.praise)
    if(this.data.love){
      ss_xx.dynamic.praise--
      this.setData({
        love:false,
        content:ss_xx
      })
      console.log("点赞后",ss_xx.dynamic.praise)
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
      this.data.inputData= inputData;
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
  formSubmit: function (e) {
    console.log("toCommenter------->",this.data.toCommenter)
    console.log("commentListIndex",commentListIndex)
    if (login) {
      if (this.data.inputData == '') {
        wx.showToast({
          title: '回复不能为空',
          icon: 'none'
        })
      }
      else {
        this.pushdynamicData();
      }
    }
    else {
      login = true;
      wx.navigateTo({
        url: '../login/login?loud=' + "detailPage",
      })
    }

  },
  //上传数据
  async pushdynamicData() {
    wx.showLoading({
      title: '发送中...',
      mask: true
    })
    var strOK = await this.checkText();
    if (strOK) {

      if(this.data.placeholder=="写下你善意的回复")
      {
        db.collection("dynamic").where({
          _id: this.data.id
        })
          .update({
            data: {
              dynamic: {
                comment: _.unshift([{
                  avatarPic: this.data.commenter.avatarPic,
                  huifuList:[],
                  content: this.data.inputData,
                  grade: this.data.commenter.grade,
                  name: this.data.commenter.name,
                  place: this.data.commenter.place,
                  openid: this.data.commenterOpenid,
                  time: new Date().getTime()
                }]),
              }
            },
          })
          .then(res => {
            this.setData({
              searchinput: '',
              inputData: '',
              placeholder:"写下你善意的回复"
            })
            this.getDetailData();
            wx.hideLoading({})
          })
      }
      else
      {
        var huifu={
          commentName:this.data.commenter.name,
          openid:this.data.commenterOpenid,
          toName:this.data.toCommenter.name,
          toOpenid:this.data.toCommenter.openid,
          text:this.data.inputData,
          time: new Date().getTime()
        }
        db.collection("dynamic").doc(this.data.id).get()
        .then(res=>{
          console.log("commentListIndex",commentListIndex)
          console.log("res.data[0].dynamic.comment",res.data.dynamic.comment)
          console.log("huifu",huifu)
          comment=res.data.dynamic.comment;
          console.log("comment[commentListIndex]",comment[commentListIndex])
          comment[commentListIndex].huifuList.unshift(huifu)
          console.log("添加评论后的comment",comment)
        })
        .then(res=>{
          db.collection("dynamic").where({
            _id: this.data.id
          })
          .update({
            data: {
              dynamic: {
              comment:comment,
              }
            },
          }) 
          .then(res => {
            this.setData({
              searchinput: '',
              inputData: '',
              placeholder:"写下你善意的回复"
            })
            this.getDetailData();
            wx.hideLoading({})
          })
        })
 
      }
      
    }

  },
  warning() {

  },
  //设置评论展开收起状态
  async setOpen() {
    var dataWithOpen = await this.open(this.data.content)
    this.setData({
      content: dataWithOpen
    })
    console.log("dataWithOpen------>", this.data.content)
  },
  //添加展开收起标记
  async open(e) {
    var l = e.dynamic.comment.length
    for (var i = 0; i < l; i++) {
        e.dynamic.comment[i].openClose = false
    }
    return e
  },

  //评论展开收起
  openCloseComment(e){
    var index=e.currentTarget.dataset.index;
    var content=this.data.content
    var commentOpen=content.dynamic.comment[index].openClose;
    console.log("commentOpen",commentOpen)
    if(!commentOpen)
    {
      console.log("展开")
      this.data.content.dynamic.comment[index].openClose=true
      this.setData({
        content:content
      })
    }
    else
    {
      console.log("收起")
      this.data.content.dynamic.comment[index].openClose=false
      this.setData({
        content:content
      })
   
    }
   
  },
  //删除评论
  delComment(e){
  var that=this;
  var index=e.currentTarget.dataset.index;
  var id=that.data.id;
  console.log("长按删除",index)
  console.log("该动态的id", id)
  wx.showModal({
   title:'提示',
   content:'确定要删除此评论？',
   success (res) {
    if (res.confirm) {
      db.collection("dynamic").doc(id).get()
      .then(res=>{
        var dynamic=res.data;
        dynamic.dynamic.comment.splice(index,1)
        db.collection("dynamic").doc(id).update({
          data:{
            dynamic:{
              comment:dynamic.dynamic.comment
            }
          }
        }).then(res=>{
          wx.showToast({
            title: '删除成功！',
          })
          that.getDetailData();
        })
    
      })
    } else if (res.cancel) {
    console.log('用户点击取消')
    }
   }
  })
 
  },
  //删除评论回复
  delhuifu(e){
    var that=this;
    //评论下标
   commentListIndex=e.currentTarget.dataset.index1
    //评论回复下标
    var index=e.currentTarget.dataset.index;
    var id=that.data.id;
    console.log("评论回复index",index)
    console.log("评论回复id",id)
    wx.showModal({
     title:'提示',
     content:'确定要删除此评论？',
     success (res) {
      if (res.confirm) {
        db.collection("dynamic").doc(id).get()
        .then(res=>{
          var comment=res.data.dynamic.comment;

          console.log("res.data.dynamic.comment",comment)
          comment[commentListIndex].huifuList.splice(index,1)
          console.log('删除评论回复结果',comment)
          db.collection("dynamic").doc(id).update({
            data:{
              dynamic:{
                comment:comment
              }
            }
          }).then(res=>{
            wx.showToast({
              title: '删除成功！',
            })
            that.getDetailData();
          })
      
        })
      } else if (res.cancel) {
      console.log('用户点击取消')
      }
     }
    })
   
    },
  //选择评论对象
  huifucomment(e){
  var that=this;
  var toCommenter={};
  if(e.currentTarget.dataset.index1!=null)
  {
    commentListIndex=e.currentTarget.dataset.index1
  }
  else
  {
    commentListIndex=e.currentTarget.dataset.index
  }
 
  console.log("回复评论接受到的数据",e.currentTarget.dataset)
  that.setData({
    placeholder:"回复 "+ e.currentTarget.dataset.name
  })
  toCommenter.name=e.currentTarget.dataset.name;
  toCommenter.openid=e.currentTarget.dataset.openid;
  that.data.toCommenter=toCommenter;
  },
  //点击回复动态
  setPlaceholder(){
  var that=this;
  that.setData({
    placeholder:"写下你善意的回复"
  })
  },
  //进入楼主主页
  inPersonPage: function (e) {
    wx.navigateTo({
      url: '../personPage/personPage?openid=' + this.data.authorOpenid,
    })
  },
  //进入评论者主页
  inPersonPage1(e) {
    console.log("进入评论者主页", e.currentTarget.dataset)
    wx.navigateTo({
      url: '../personPage/personPage?openid=' + e.currentTarget.dataset.openid,
    })
  },
  
})