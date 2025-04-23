<template>
    <div style="padding: 10px;">
        <el-table :data="modificationList" style="width: 100%">
            <el-table-column prop="modificationTime" label="修改时间" width="180" />
            <el-table-column prop="id" label="论文ID" width="180" />
            <el-table-column prop="teacherId" label="指导教师" />
            <el-table-column label="修改内容">
                <template slot-scope="scope">
                    {{ scope.row.modificationWhat || '无修改内容' }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
                <template slot-scope="scope">
                    <el-button @click="handleDetail(scope.row)" type="primary" size="small">
                        详情
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="pagination.page"
            :page-sizes="[10, 20, 30, 40]" :page-size="pagination.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total" />
    </div>
</template>

<script>
import axios from 'axios';
import Cookies from 'js-cookie';

export default {
    name: "ModificationHistory",
    data() {
        return {
            modificationList: [],  // 修改后的数据列表
            pagination: {         // 分页对象
                page: 1,
                pageSize: 10,
                total: 0
            }
        };
    },
    created() {
        this.loadData();
    },
    methods: {
        // 加载数据
        async loadData() {
            try {
                const response = await axios.post(
                    'http://localhost:9251/api/modification/getModification',
                    {
                        stuId: Number(Cookies.get('userId')),
                        page: this.pagination.page,
                        pageSize: this.pagination.pageSize
                    },
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                console.log({
                        stuId: Number(Cookies.get('userId')),
                        page: this.pagination.page,
                        pageSize: this.pagination.pageSize
                    })
                console.log(response);
                this.modificationList = response.data || [];
                // this.pagination.total = response.data.data.total || 0;
            } catch (error) {
                console.error('请求异常:', error);
                this.$message.error('数据加载失败');
            }
        },

        // 查看详情
        handleDetail(row) {
            console.log(row);
            localStorage.setItem('modification', JSON.stringify(row));
            this.$router.push({
                name: 'ModificationCompare',
            });
        },

        // 分页大小改变
        handleSizeChange(newSize) {
            this.pagination.pageSize = newSize;
            this.pagination.page = 1;  // 重置到第一页
            this.loadData();
        },

        // 页码改变
        handleCurrentChange(newPage) {
            this.pagination.page = newPage;
            this.loadData();
        }
    }
};
</script>

<style scoped>
.el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
}
</style>