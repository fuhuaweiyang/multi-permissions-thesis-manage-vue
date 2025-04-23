<template>
    <div>
    <el-carousel :interval="4000" type="card" height="400px">
        <el-carousel-item  style="margin-left: 50px;margin-right: 50px;">
            <img src="@/assets/jnu1.jpg" style="height: 400px;width: 650px;">
        </el-carousel-item>
        <el-carousel-item style="margin-left: 50px;margin-right: 50px;">
            <img src="@/assets/jnu2.jpg"  style="height: 400px;width: 650px;">
        </el-carousel-item>
        <el-carousel-item style="margin-left: 50px;margin-right: 50px;">
            <img src="@/assets/jnu3.jpg" style="height: 400px;width: 650px;">
        </el-carousel-item>
    </el-carousel>
    <div style="margin-bottom: 20px;"> 
        <div style="font-size: 36px;font-weight: bold;margin-top: 20px;margin-bottom: 40px;text-align: center;">    
            <b @click="()=>{this.$router.push({path:'/point'})} ">
                重要通知
            </b>
        </div> 
        <el-card v-for="item2 in points " class="box-card" :key="item2.id">
            <div slot="header" class="clearfix" style="display: flex;">
                <span>{{ item2.title }}</span> 
                <div style="margin-left: auto; margin-right: 20px;">
                    {{ item2.createTime.split("T")[0] }}
                </div>
            </div>
            <div>
                <div>
                    {{ item2.content  }} 
                </div>
            </div>
        </el-card>
    </div>
</div>
</template>

<script>
import {stuPointList} from '@/api/admin/knowpoint'
import Cookies from "js-cookie";
import axios from 'axios'
export default {
    name: "home",
    data() {
        return {
            points:[]
        }
    },
    created() {
        let classId=Cookies.get("classId")
        axios.get('http://localhost:9251/api/study/knowledgePoint/stuPointList?classId='+classId,).then(res=>{
            this.points=res.data.resultData
            console.log(this.points);    
        })

     }
}
</script>

<style scoped>
.con{
    height: 100vh!important;
    overflow-y: auto!important;
}
.el-card{
    margin-top: 20px;  
}

#tips {
    font-size: 26px;
    font-weight: 600;
}
</style>