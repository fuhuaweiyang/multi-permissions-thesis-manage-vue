<template>
    <div class="container">
        <div style="width: 50%; height: 50%; display: flex;background-color: #ffffff;">
            <div style="width: 50%; position: relative;">
                <img src="../../assets/suzuka.gif" width="80%" height="80%"
                    style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); box-sizing: border-box;">
            </div>
            <div style="flex: 1;width: 50%; padding: 40px;display: flex;flex-direction: column;justify-content: center;">
                <div
                    style="text-align: center; font-size: 24px; margin-bottom: 20px; color: #41647a;font-weight: bold;font-size: 30px">
                    论文系统</div>

                <el-form :model="tabUser" style="background-color: #fff;opacity: 0.95;">

                    <br>
                    <!-- 用户名 -->
                    <br>
                    <el-form-item>
                        <el-input placeholder="账号" prefix-icon="iconfont icon-r-user2" v-model="tabUser.account"></el-input>
                    </el-form-item>
                    <!-- 密码 -->
                    <el-form-item>
                        <el-input placeholder="密码" show-password prefix-icon="iconfont icon-r-lock"
                            v-model="tabUser.password"></el-input>
                    </el-form-item>
                    <br>
                    <el-button type="" style="background-color: #41647a;color: #ffffff" @click="login(tabUser)">
                        登录
                    </el-button>
                    <el-button type="" style="background-color: #41647a;color: #ffffff" @click="dialog = true">
                        注册
                    </el-button>
                </el-form>
            </div>
        </div>



        <el-drawer title="注册账号" :visible.sync="dialog" ref="drawer">
            <el-form :model="form" :rules="rules" style="padding: 0 20px 0 20px;">
                <el-form-item label="姓名" :label-width="formLabelWidth">
                    <el-input v-model="form.userName" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="账号" :label-width="formLabelWidth">
                    <el-input v-model="form.account" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="电话" :label-width="formLabelWidth">
                    <el-input v-model="form.phone" autocomplete="off"></el-input>
                </el-form-item>

                <el-form-item :show-password="true" label="密码" :label-width="formLabelWidth" prop="password">
                    <el-input :placeholder="form.password" v-model="form.password" type="password"></el-input>
                </el-form-item>
                <el-form-item :show-password="true" label="确认密码" :label-width="formLabelWidth" prop="confirmPassword">
                    <el-input :placeholder="form.confirmPassword" type="password" v-model="form.confirmPassword"></el-input>
                </el-form-item>
                <el-form-item label="性别" :label-width="formLabelWidth">
                    <el-select v-model="form.sex" placeholder="请选择性别">
                        <el-option label="男" value="0"></el-option>
                        <el-option label="女" value="1"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div style="width: 100%; text-align: center">
                <el-button type="success" @click="confirm(form)"> 注册新账号</el-button>
            </div>
        </el-drawer>
    </div>
</template>
<script>

import { loginRequest, register } from "../../api/login";
import Cookies from 'js-cookie'
export default {
    name: "Login",
    data() {
        var validatePass2 = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入密码'))
            } else if (value !== this.form.password) {
                callback(new Error('两次输入密码不一致!'))
            } else {
                callback()
            }
        }
        return {
            tabUser: {
                account: '',
                password: '',
                // VerificationCode: '',
                // checkbox: false,
            },
            form: {
                userName: '',
                account: '',
                sex: '',
                phone: '',
                password: '',
                confirmPassword: [],
                desc: ''
            },
            formLabelWidth: '80px',
            timer: null,
            dialog: false,
            loading: false,



            rules: {
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' },
                ],
                confirmPassword: [
                    { required: true, validator: validatePass2, trigger: 'blur' }
                ]
            }
        }

    },
    created() {

    },
    methods: {

        confirm(form) {

            if (this.form.userName.trim() == '') {
                this.$message({
                    message: '姓名不能为空',
                    type: 'error'
                });
                return
            }
            if (this.form.account.trim() == '') {
                this.$message({
                    message: '账号不能为空',
                    type: 'error'
                });
                return
            }
            if (this.form.sex.trim() == '') {
                this.$message({
                    message: '请选择性别',
                    type: 'error'
                });
                return
            }
            if (this.form.phone.trim() == '') {
                this.$message({
                    message: '电话不能为空',
                    type: 'error'
                });
                return
            }
            if (this.form.password.trim() == '') {
                this.$message({
                    message: '密码不能为空',
                    type: 'error'
                });
                return
            }
            if (this.form.password !== this.form.confirmPassword) {
                this.$message({
                    message: '两次输入密码不一致',
                    type: 'error'
                });
                return
            }
            register(form).then(resp => {
                if (resp.data.code == 200) {
                    this.dialog = false;
                    this.$message({
                        message: '注册成功',
                        type: 'success'
                    });
                } else {
                    this.$message.error('注册失败，账号已存在');
                }
            })
        },
        cancelForm() {
            this.loading = false;
            this.dialog = false;
            clearTimeout(this.timer);
        },


        sendCode() {

        },
        login(tabUser) {
            loginRequest(tabUser).then(resp => {
                Cookies.set('roleId', resp.data.resultData.roleId)
                Cookies.set('userId', resp.data.resultData.userId)
                Cookies.set('classId', resp.data.resultData.classId)
                Cookies.set('userName', resp.data.resultData.userName)
                localStorage.setItem("userName", resp.data.resultData.userName)
                localStorage.setItem("userId", resp.data.resultData.userId)
                localStorage.setItem("classId", resp.data.resultData.classId)
                console.log(resp.data.resultData.userName)
                if (resp.data.code == 200) {
                    if (resp.data.resultData.roleId == 1) {
                        this.$router.push("/adminHome")
                    }
                    if (resp.data.resultData.roleId == 2) {
                        this.$router.push("/teacherHome")
                    }
                    if (resp.data.resultData.roleId == 3) {
                        this.$router.push("/studentweb")
                    }
                    this.$message({
                        message: '登录成功',
                        type: 'success'
                    });
                } else {
                    this.$message.error('账号或者密码错误');
                }
            }).catch((e) => {
                console.log(e);
                if (
                    e.response == undefined ||
                    e.response.data == undefined
                ) {
                    this.$message({
                        showClose: true,
                        message: e,
                        type: "error",
                        duration: 20000,
                    });
                } else {
                    this.$message({
                        showClose: true,
                        message: e.response.data,
                        type: "error",
                        duration: 20000,
                    });
                }
            })

        },

    }
}
</script>
<style scoped>
.onfont[data-v-2529d779] {
    /* display: flex; */
    /* justify-content: center; */
    position: absolute;
    left: 50%;
    top: 120px;
}

.lr {
    width: 100%;
    display: flex;
    justify-content: space-between;
}




.login_box {
    text-align: center;
    padding-top: 70px;


}

.lf {
    padding: 20px;
    position: absolute;
    bottom: 0;
    width: 100%;
    box-sizing: border-box;
}

.el-button {
    width: 48%;
}

.code {
    width: 45%;
}

.code1 {
    /* style="width: 100px; height: 30px; margin-left:5px;vertical-align: middle;" */
    display: line-inline;
    width: 45%;
    height: 28px;
    margin-left: 10px;
    vertical-align: middle;
    border-radius: 3px;
}

.rememberMe {
    color: #fff;
}

.container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-image: url("../../assets/login_Background.png");
    background-size: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
}</style>
