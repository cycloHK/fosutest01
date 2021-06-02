//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        env: 'fosusquare-9gwq61i6a0c9d216',
        traceUser: true,
      })
    }
    
    this.loveinfo="",
    this.ssinfo={
      lovenb:"",
      plnb:"",
      looknb:""
    },
    this.globalData = {
      userinfo: {
        ifStudent: '未认证',
        avatarPic: '',
        name: '',
        sex: '',
        grade: '',
        place: '',
        class:'',
        department:'',
      },
      signature:'个性签名',
      imgList: [],
      iflogin:1,
      dynamic:[],
      loginTime:'',
    }

    if(wx.getStorageSync('openid')){
            this.globalData.openid = wx.getStorageSync('openid')
            console.log(this.globalData.openid)
          }
          var that = this;
          wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: res => {
              console.log('[云函数] [login] user openid: ', res.result.openid)
              that.globalData.openid = res.result.openid
              wx.setStorageSync('openid', res.result.openid)
            },
            fail: err => {
              console.error('[云函数] [login] 调用失败', err)
            }
          })
    //这里已经获取到用户的openid，并存入缓存，所以其他用到openid的页面不需要再通过云函数获取，直接用全局变量app.globalData.openid就可以

    wx.getSystemInfo({
    success: e => {
      this.globalData.StatusBar = e.statusBarHeight;
      let custom = wx.getMenuButtonBoundingClientRect();
      this.globalData.Custom = custom;  
      this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
    }
  })
  }
})
