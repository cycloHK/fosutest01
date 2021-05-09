// miniprogram/pages/setting/setting.js

var fileid='';
const app = getApp()
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    
    avatorimg:'',
    showModal: true,
    index: null,
    userinfo: {},
    hiddenmodalput: true,
    pickersex: ['男', '女'],
    indexSex: 0,
    pickerplace: ['仙溪校区', '江湾校区', '河滨校区'],
    indexPlace: 0,
    myClass: '',
    myDepartment: '请选择学院',
    myGrade: '请选择年级',
    departments:[],
    departmentsIndex: 0,
    grades: [],
    gradesIndex: 0,
    classesObject:{},
    classes: ['请先选择学院与年级'],
    classesIndex: 0,
    count:0
  },

  
   //生命周期函数--监听页面加载！！！！！！！！！！！！！！
   onLoad: function (options) {
    this.getUserInfo();
    this.getDepartment();
  },
  onShow:function(){
  
  },
  onPullDownRefresh: function () {
    this.getUserInfo();
    wx.stopPullDownRefresh({})
    wx.showToast({
      title: '刷新成功',
      icon: 'none',
      duration: 800
    })
  },
 getDepartment(){
    db.collection("studentInfo").get()
    .then((res)=>{
      this.setData({
        classesObject:res.data[0].classesObject,
        departments:res.data[0].departments,
        grades:res.data[0].grades
      })
    })
 },
  getUserInfo() {
    //调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      db.collection("usersInfformation").where({
        _openid: res.result.openid
      }).get().then((res) => {
        this.setData({
          userinfo: res.data[0].userinfo,
          myClass:res.data[0].userinfo.class,
          myDepartment:res.data[0].userinfo.department,
          myGrade:res.data[0].userinfo.grade

        })
        console.log("用户信息",this.data.userinfo)
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
   //开始审核文本
   async checkText() {
    var text = this.data.userinfo.name
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
        "userinfo.name": '',
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
    var img = this.data.avatorimg//图片临时路径赋值给变量img
    //开始图片审核
    if (img.length != 0) {
     
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
            avatorimg: ''
          })
          return false
        } else if (checkOk != 0) {
         
            connectIsOK = false;
          wx.showToast({
            title: '图片检测出现问题',
            icon: 'none',
            duration: 2000,
          })
          this.setData({
            avatorimg:''
          })
          return false
        }
        else {
          return true
        }
      }
      
    }
    else {
      return true
    }
   
  },
  //修改名称
  setName: function () {
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
            userinfo: {
              name: this.data.userinfo.name
            }
          }
        }).then((res) => {
        })
        db.collection('dynamic').where({
          _openid: res.result.openid
        }).update({
          data:{
            dynamic:{
              author:{
                name: this.data.userinfo.name
              }
            }
          }
        }).then(res=>{
          wx.hideLoading({})
        })
      });
    }
   
    this.setData({
      hiddenmodalput: true
    })
  },
  iName: function (e) {
    this.setData({
      "userinfo.name": e.detail.value
    })
  },
  
  
  PickerChangeSex(e) {
    this.setData({
      "userinfo.sex": this.data.pickersex[e.detail.value]
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
          userinfo: {
            sex: this.data.userinfo.sex
          }
        }
      }).then((res) => {
      })
      db.collection('dynamic').where({
        _openid: res.result.openid
      }).update({
        data:{
          dynamic:{
            author:{
              sex: this.data.userinfo.sex
            }
          }
        }
      })
    });
  },
  PickerChange(e) {
    console.log(e);
    this.setData({
      index: e.detail.value
    })
  },
  
  PickerChangePlace(e) {
    this.setData({
      "userinfo.place": this.data.pickerplace[e.detail.value]
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
          userinfo: {
            place: this.data.userinfo.place
          }
        }
      }).then((res) => {
      })
      db.collection('dynamic').where({
        _openid: res.result.openid
      }).update({
        data:{
          dynamic:{
            author:{
              place: this.data.userinfo.place
            }
          }
        }
      })
    });
  },

  cancel: function () {
    this.setData({
      showModal: true,
      "userinfo.avatarPic": this.data.userinfo.avatarPic
    })
  },
  confirm: function () {
    this.setData({
      showModal: true
    })
  },

  changeAvatarPic() {
    wx.chooseImage({
      count: 1, // 默认9     
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({
          showModal: false,
        })
        this.cloudFile(res.tempFilePaths[0])
      }
    })
  },

  cloudFile(path) {
    wx.cloud.uploadFile({
      cloudPath: "userAvatorPic/" + Date.now() + ".jpg",
      filePath: path
    }).then(res => {
      fileid=res.fileID;
      this.data.avatorimg=res.fileID;
      this.upAvatarPic();
     
    })
  },

 async upAvatarPic(){
  var imgOK = await this.checkimages();
  if(imgOK)
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
        userinfo: {
          avatarPic:this.data.avatorimg
        }
      }
    }).then((res) => {
      this.setData({
        "userinfo.avatarPic":this.data.avatorimg
      })
    })
    db.collection('dynamic').where({
      _openid: res.result.openid
    }).update({
      data:{
        dynamic:{
          author:{
            avatarPic:this.data.avatorimg
          }
        }
      }
    }).then(res=>{
      wx.hideLoading({})
    })
  });
  }
  },
  selectDepartment: function (e) {
    console.log(e)
    let departmentsIndex = e.detail.value
    let department = this.data.departments[departmentsIndex]
    let grade = this.data.grades[0]
    let classesObject = this.data.classesObject
    let classes = classesObject[department + grade]
    console.log(department+grade)
    if (!classes) {
      console.log(classes)
      classes = ['该学院年级无班级数据']
    }
    this.setData({
      departmentsIndex,
      classes,
      classesIndex: 0,
      myClass: classes[0],
      myDepartment: department,
      myGrade:grade,
      gradesIndex:0
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
          userinfo: {
            department: this.data.myDepartment
          }
        }
      }).then((res) => {
      })
      db.collection('dynamic').where({
        _openid: res.result.openid
      }).update({
        data:{
          dynamic:{
            author:{
              department: this.data.myDepartment
            }
          }
        }
      })
    });
  },
  selectGrade: function (e) {
    let gradesIndex = e.detail.value
    let grade = this.data.grades[gradesIndex]
    let department = this.data.departments[this.data.departmentsIndex]
    let classes = this.data.classesObject[department + grade]
    if (!classes) {
      console.log(classes)
      classes = ['该学院年级无班级数据']
    }
    this.setData({
      gradesIndex,
      classes,
      myClass: classes[0],
      classesIndex: 0,
      myGrade: grade
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
          userinfo: {
            grade: this.data.myGrade
          }
        }
      }).then((res) => {
      })
      db.collection('dynamic').where({
        _openid: res.result.openid
      }).update({
        data:{
          dynamic:{
            author:{
              grade: this.data.myGrade
            }
          }
        }
      })
    });
  },
  selectClass: function (e) {
    let myClass = this.data.classes[e.detail.value]
    this.setData({
      classesIndex: e.detail.value,
      myClass:myClass,
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
          userinfo: {
            class:this.data.myClass
          }
        }
      }).then((res) => {
      })
      db.collection('dynamic').where({
        _openid: res.result.openid
      }).update({
        data:{
          dynamic:{
            author:{
              class:this.data.myClass
            }
          }
        }
      })
    });
  },

})