// Vue.js 组件
const AccountList = {
    template: `
    <div>
      <h1>账户列表</h1>
      <!-- 搜索框 -->
      <input v-model="searchQuery" placeholder="搜索账户名称" />
      <!-- 账户列表 -->
      <ul>
        <li v-for="account in filteredAccounts" :key="account.id">
          {{ account.name }}
          <button @click="viewDetails(account.id)">查看详情</button>
          <button @click="editAccount(account.id)">编辑</button>
          <button @click="deleteAccount(account.id)">删除</button>
        </li>
      </ul>
      <!-- 分页 -->
      <div>
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
      <!-- 创建账户按钮 -->
      <button @click="createAccount">创建账户</button>
    </div>
  `,
    data() {
        return {
            accounts: [], // 账户列表
            searchQuery: '', // 搜索关键字
            currentPage: 1, // 当前页码
            pageSize: 20, // 每页显示数量
            totalPages: 1, // 总页数
        };
    },
    computed: {
        // 过滤后的账户列表
        filteredAccounts() {
            return this.accounts.filter(account =>
                account.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
    },
    created() {
        this.fetchAccounts();
    },
    methods: {
        // 获取账户列表
        async fetchAccounts() {
            try {
                const response = await axios.get('http://127.0.0.1:8000/account/accounts/');
                this.accounts = response.data;
                this.totalPages = Math.ceil(this.accounts.length / this.pageSize);
            } catch (error) {
                console.error('获取账户列表失败', error);
            }
        },
        // 查看账户详情
        viewDetails(accountId) {
            this.$router.push(`/account/${accountId}`);
        },
        // 编辑账户
        editAccount(accountId) {
            this.$router.push(`/account/edit/${accountId}`);
        },
        // 删除账户
        async deleteAccount(accountId) {
            try {
                await axios.delete(`http://127.0.0.1:8000/account/accounts/${accountId}/`);
                this.fetchAccounts(); // 重新加载账户列表
            } catch (error) {
                console.error('删除账户失败', error);
            }
        },
        // 创建账户
        createAccount() {
            this.$router.push('/account/create');
        },
        // 上一页
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
        // 下一页
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
    },
};

const AccountDetail = {
    template: `
    <div>
      <h1>账户详情</h1>
      <p>名称: {{ account.name }}</p>
      <p>描述: {{ account.description }}</p>
      <button @click="goBack">返回</button>
    </div>
  `,
    data() {
        return {
            account: {}, // 账户详情
        };
    },
    created() {
        this.fetchAccountDetails();
    },
    methods: {
        // 获取账户详情
        async fetchAccountDetails() {
            try {
                const accountId = this.$route.params.id;
                const response = await axios.get(`http://127.0.0.1:8000/account/accounts/${accountId}/`);
                this.account = response.data;
            } catch (error) {
                console.error('获取账户详情失败', error);
            }
        },
        // 返回上一页
        goBack() {
            this.$router.go(-1);
        },
    },
};

const CreateAccount = {
    template: `
    <div>
      <h1>创建账户</h1>
      <form @submit.prevent="submitForm">
        <div>
          <label>账户名称:</label>
          <input v-model="account.name" required />
        </div>
        <div>
          <label>描述:</label>
          <textarea v-model="account.description"></textarea>
        </div>
        <button type="submit">提交</button>
      </form>
    </div>
  `,
    data() {
        return {
            account: {
                name: '',
                description: '',
            },
        };
    },
    methods: {
        // 提交表单
        async submitForm() {
            try {
                const response = await axios.post('http://127.0.0.1:8000/account/accounts/', this.account);
                this.$router.push('/'); // 返回账户列表
            } catch (error) {
                console.error('创建账户失败', error);
            }
        },
    },
};

const EditAccount = {
    template: `
    <div>
      <h1>编辑账户</h1>
      <form @submit.prevent="submitForm">
        <div>
          <label>账户名称:</label>
          <input v-model="account.name" required />
        </div>
        <div>
          <label>描述:</label>
          <textarea v-model="account.description"></textarea>
        </div>
        <button type="submit">保存</button>
      </form>
    </div>
  `,
    data() {
        return {
            account: {
                name: '',
                description: '',
            },
        };
    },
    created() {
        this.fetchAccountDetails();
    },
    methods: {
        // 获取账户详情
        async fetchAccountDetails() {
            try {
                const accountId = this.$route.params.id;
                const response = await axios.get(`http://127.0.0.1:8000/account/accounts/${accountId}/`);
                this.account = response.data;
            } catch (error) {
                console.error('获取账户详情失败', error);
            }
        },
        // 提交表单
        async submitForm() {
            try {
                const accountId = this.$route.params.id;
                await axios.put(`http://127.0.0.1:8000/account/accounts/${accountId}/`, this.account);
                this.$router.push('/'); // 返回账户列表
            } catch (error) {
                console.error('更新账户失败', error);
            }
        },
    },
};

// 路由配置
const routes = [
    { path: '/', component: AccountList },
    { path: '/account/create', component: CreateAccount },
    { path: '/account/:id', component: AccountDetail },
    { path: '/account/edit/:id', component: EditAccount },
];

const router = new VueRouter({
    routes,
});

// 创建 Vue 实例
const app = new Vue({
    router,
}).$mount('#app');