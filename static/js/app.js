// Vue.js 组件
const AccountList = {
    template: `
    <div>
      <h1>账户列表</h1>
      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索账户名称"
        @input="fetchAccounts"
        style="margin-bottom: 20px;"
      />
      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="6" animated />
      <!-- 账户列表 -->
      <el-table v-else :data="filteredAccounts" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="label" label="标签" />
        <el-table-column prop="deleted" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.deleted === '0' ? 'success' : 'danger'">
              {{ row.deleted === '0' ? '启用' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" @click="viewDetails(row.id)">查看详情</el-button>
            <el-button type="warning" @click="editAccount(row.id)">编辑</el-button>
            <el-button type="danger" @click="deleteAccount(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <el-pagination
        style="margin-top: 20px;"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        @current-change="handlePageChange"
      />
      <!-- 创建账户按钮 -->
      <el-button type="success" @click="createAccount" style="margin-top: 20px;">
        创建账户
      </el-button>
    </div>
  `,
    data() {
        return {
            accounts: [], // 账户列表
            searchQuery: '', // 搜索关键字
            currentPage: 1, // 当前页码
            pageSize: 20, // 每页显示数量
            totalCount: 0, // 总记录数
            loading: true, // 加载状态
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
            this.loading = true;
            try {
                const response = await axios.get('http://127.0.0.1:8000/account/accounts/', {
                    params: {
                        search: this.searchQuery,
                        page: this.currentPage,
                        page_size: this.pageSize,
                    },
                });
                this.accounts = response.data.results;
                this.totalCount = response.data.count;
            } catch (error) {
                console.error('获取账户列表失败', error);
            }
            this.loading = false;
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
        // 分页切换
        handlePageChange(page) {
            this.currentPage = page;
            this.fetchAccounts();
        },
    },
};

const RetrieveAccount = {
    template: `
    <div>
      <h1>账户详情</h1>
      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="6" animated />
      <div v-else>
        <!-- PageList 信息 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List</h2>
          <p>ID: {{ pageList.id }}</p>
          <p>Name: {{ pageList.name }}</p>
          <p>Label: {{ pageList.label }}</p>
          <p>Deleted: {{ pageList.deleted }}</p>
        </el-card>

        <!-- PageListField 信息 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List Fields</h2>
          <el-table :data="pageListFields" style="width: 100%">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="hidden" label="Hidden" />
            <el-table-column prop="type" label="Type" />
            <el-table-column prop="deleted" label="Deleted" />
          </el-table>
        </el-card>

        <!-- PageLayout 信息 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layouts</h2>
          <el-table :data="pageLayouts" style="width: 100%">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="deleted" label="Deleted" />
          </el-table>
        </el-card>

        <!-- PageLayoutField 信息 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layout Fields</h2>
          <el-table :data="pageLayoutFields" style="width: 100%">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="label" label="Label" />
            <el-table-column prop="type" label="Type" />
            <el-table-column prop="deleted" label="Deleted" />
          </el-table>
        </el-card>

        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
  `,
    data() {
        return {
            pageList: {}, // PageList 数据
            pageListFields: [], // PageListField 数据
            pageLayouts: [], // PageLayout 数据
            pageLayoutFields: [], // PageLayoutField 数据
            loading: true, // 加载状态
        };
    },
    created() {
        this.fetchData();
    },
    methods: {
        // 获取数据
        async fetchData() {
            try {
                const accountId = this.$route.params.id;
                const response = await axios.get(`http://127.0.0.1:8000/account/accounts/${accountId}/`);
                this.pageList = response.data.page_list;
                this.pageListFields = response.data.page_list_fields;
                this.pageLayouts = response.data.page_layouts;
                this.pageLayoutFields = response.data.page_layout_fields;
            } catch (error) {
                console.error('获取数据失败', error);
            }
            this.loading = false;
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
      <el-form :model="formData" label-width="120px">
        <!-- Object 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Object</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.object.name" />
          </el-form-item>
          <el-form-item label="Label">
            <el-input v-model="formData.object.label" />
          </el-form-item>
          <el-form-item label="Table Name" required>
            <el-input v-model="formData.object.table_name" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.object.deleted" />
          </el-form-item>
        </el-card>

        <!-- ObjectField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Object Field</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.objectFields[0].name" />
          </el-form-item>
          <el-form-item label="Type" required>
            <el-input v-model="formData.objectFields[0].type" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.objectFields[0].deleted" />
          </el-form-item>
        </el-card>

        <!-- PageList 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.pageList.name" />
          </el-form-item>
          <el-form-item label="Label">
            <el-input v-model="formData.pageList.label" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.pageList.deleted" />
          </el-form-item>
        </el-card>

        <!-- PageListField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List Field</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.pageListFields[0].name" />
          </el-form-item>
          <el-form-item label="Hidden">
            <el-input v-model="formData.pageListFields[0].hidden" />
          </el-form-item>
          <el-form-item label="Type" required>
            <el-input v-model="formData.pageListFields[0].type" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.pageListFields[0].deleted" />
          </el-form-item>
        </el-card>

        <!-- PageLayout 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layout</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.pageLayout.name" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.pageLayout.deleted" />
          </el-form-item>
        </el-card>

        <!-- PageLayoutField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layout Field</h2>
          <el-form-item label="Name" required>
            <el-input v-model="formData.pageLayoutFields[0].name" />
          </el-form-item>
          <el-form-item label="Label">
            <el-input v-model="formData.pageLayoutFields[0].label" />
          </el-form-item>
          <el-form-item label="Type" required>
            <el-input v-model="formData.pageLayoutFields[0].type" />
          </el-form-item>
          <el-form-item label="Deleted">
            <el-input v-model="formData.pageLayoutFields[0].deleted" />
          </el-form-item>
        </el-card>

        <el-button type="primary" @click="submitForm">提交</el-button>
      </el-form>
    </div>
  `,
    data() {
        return {
            formData: {
                object: {
                    name: "",
                    label: "",
                    table_name: "",
                    deleted: "0",
                },
                objectFields: [
                    {
                        name: "",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageList: {
                    name: "",
                    label: "",
                    deleted: "0",
                },
                pageListFields: [
                    {
                        name: "",
                        hidden: "0",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageLayout: {
                    name: "",
                    deleted: "0",
                },
                pageLayoutFields: [
                    {
                        name: "",
                        label: "",
                        type: "",
                        deleted: "0",
                    },
                ],
            },
        };
    },
    methods: {
        async submitForm() {
            try {
                const requestData = {
                    object: this.formData.object,
                    object_fields: this.formData.objectFields,
                    page_list: this.formData.pageList,
                    page_list_fields: this.formData.pageListFields,
                    page_layout: this.formData.pageLayout,
                    page_layout_fields: this.formData.pageLayoutFields,
                };
                const response = await axios.post('http://127.0.0.1:8000/account/accounts/', requestData);
                if (response.status === 201) {
                    this.$message.success("创建成功！");
                    this.$router.push("/"); // 返回账户列表
                    this.resetForm(); // 清空表单
                }
            } catch (error) {
                console.error("创建失败:", error);
                if (error.response) {
                    this.$message.error(`创建失败: ${error.response.data}`);
                } else {
                    this.$message.error("创建失败，请检查网络连接或服务器状态。");
                }
            }
        },
        resetForm() {
            this.formData = {
                object: {
                    name: "",
                    label: "",
                    table_name: "",
                    deleted: "0",
                },
                objectFields: [
                    {
                        name: "",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageList: {
                    name: "",
                    label: "",
                    deleted: "0",
                },
                pageListFields: [
                    {
                        name: "",
                        hidden: "0",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageLayout: {
                    name: "",
                    deleted: "0",
                },
                pageLayoutFields: [
                    {
                        name: "",
                        label: "",
                        type: "",
                        deleted: "0",
                    },
                ],
            };
        },
    },
};

const UpdateAccount = {
    template: `
  <div>
    <h1>编辑账户</h1>
    <el-form :model="formData" label-width="120px">
      <!-- Object 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Object</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.object.name" />
        </el-form-item>
        <el-form-item label="Label">
          <el-input v-model="formData.object.label" />
        </el-form-item>
        <el-form-item label="Table Name" required>
          <el-input v-model="formData.object.table_name" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.object.deleted" />
        </el-form-item>
      </el-card>

      <!-- ObjectField 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Object Field</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.objectFields[0].name" />
        </el-form-item>
        <el-form-item label="Type" required>
          <el-input v-model="formData.objectFields[0].type" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.objectFields[0].deleted" />
        </el-form-item>
      </el-card>

      <!-- PageList 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Page List</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.pageList.name" />
        </el-form-item>
        <el-form-item label="Label">
          <el-input v-model="formData.pageList.label" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.pageList.deleted" />
        </el-form-item>
      </el-card>

      <!-- PageListField 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Page List Field</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.pageListFields[0].name" />
        </el-form-item>
        <el-form-item label="Hidden">
          <el-input v-model="formData.pageListFields[0].hidden" />
        </el-form-item>
        <el-form-item label="Type" required>
          <el-input v-model="formData.pageListFields[0].type" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.pageListFields[0].deleted" />
        </el-form-item>
      </el-card>

      <!-- PageLayout 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Page Layout</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.pageLayout.name" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.pageLayout.deleted" />
        </el-form-item>
      </el-card>

      <!-- PageLayoutField 表单 -->
      <el-card style="margin-bottom: 20px;">
        <h2>Page Layout Field</h2>
        <el-form-item label="Name" required>
          <el-input v-model="formData.pageLayoutFields[0].name" />
        </el-form-item>
        <el-form-item label="Label">
          <el-input v-model="formData.pageLayoutFields[0].label" />
        </el-form-item>
        <el-form-item label="Type" required>
          <el-input v-model="formData.pageLayoutFields[0].type" />
        </el-form-item>
        <el-form-item label="Deleted">
          <el-input v-model="formData.pageLayoutFields[0].deleted" />
        </el-form-item>
      </el-card>

      <el-button type="primary" @click="submitForm">保存</el-button>
    </el-form>
  </div>
  `,
    data() {
        return {
            formData: {
                object: {
                    name: "",
                    label: "",
                    table_name: "",
                    deleted: "0",
                },
                objectFields: [
                    {
                        name: "",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageList: {
                    name: "",
                    label: "",
                    deleted: "0",
                },
                pageListFields: [
                    {
                        name: "",
                        hidden: "0",
                        type: "",
                        deleted: "0",
                    },
                ],
                pageLayout: {
                    name: "",
                    deleted: "0",
                },
                pageLayoutFields: [
                    {
                        name: "",
                        label: "",
                        type: "",
                        deleted: "0",
                    },
                ],
            },
            loading: true, // 加载状态
        };
    },
    created() {
        this.fetchData();
    },
    methods: {
        // 获取数据
        async fetchData() {
            try {
                const accountId = this.$route.params.id; // 从路由中获取 ID
                const response = await axios.get(`http://127.0.0.1:8000/account/accounts/${accountId}/`);
                console.log(response.data); // 打印返回的数据
                console.log(response.data.object);
                console.log(response.data.objectFields);
                console.log(response.data.pageList);
                console.log(response.data.pageListFields);
                console.log(response.data.pageLayout);
                console.log(response.data.pageLayoutFields);
                this.formData = {
                    object: response.data.object || { name: "", label: "", table_name: "", deleted: "0" },
                    objectFields: response.data.objectFields || [{ name: "", type: "", deleted: "0" }],
                    pageList: response.data.pageList || { name: "", label: "", deleted: "0" },
                    pageListFields: response.data.pageListFields || [{ name: "", hidden: "0", type: "", deleted: "0" }],
                    pageLayout: response.data.pageLayout || { name: "", deleted: "0" },
                    pageLayoutFields: response.data.pageLayoutFields || [{ name: "", label: "", type: "", deleted: "0" }],
                };
                this.loading = false;// 填充表单数据
            } catch (error) {
                console.error("获取数据失败:", error);
                if (error.response) {
                    this.$message.error(`获取数据失败: ${error.response.data}`);
                } else {
                    this.$message.error("获取数据失败，请检查网络连接或服务器状态。");
                }
            }
        },
        // 提交表单
        async submitForm() {
            try {
                const accountId = this.$route.params.id; // 从路由中获取 ID
                const requestData = {
                    object: this.formData.object,
                    object_fields: this.formData.objectFields,
                    page_list: this.formData.pageList,
                    page_list_fields: this.formData.pageListFields,
                    page_layout: this.formData.pageLayout,
                    page_layout_fields: this.formData.pageLayoutFields,
                };
                console.log(requestData); // 打印提交的数据
                const response = await axios.put(`http://127.0.0.1:8000/account/accounts/${accountId}/`, requestData);
                if (response.status === 200) {
                    this.$message.success("更新成功！");
                    this.$router.push("/"); // 返回账户列表
                }
            } catch (error) {
                console.error("更新失败:", error);
                if (error.response) {
                    this.$message.error(`更新失败: ${error.response.data}`);
                } else {
                    this.$message.error("更新失败，请检查网络连接或服务器状态。");
                }
            }
        },
    },
};

const NotFound = { template: '<div>404 Not Found</div>' };

// 使用全局的 Vue Router 创建路由实例
const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(), // 使用 HTML5 历史模式
    routes: [
        {
            path: '/',
            component: AccountList, // 初始界面
        },
        {
            path: '/account/create',
            component: CreateAccount,
        },
        {
            path: '/account/:id',
            component: RetrieveAccount,
        },
        {
            path: '/account/edit/:id',
            component: UpdateAccount,
        },
        {
            path: '/:catchAll(.*)',
            component: NotFound
        }
    ],
});

// 使用全局的 Vue 创建应用实例
const app = Vue.createApp({});

app.use(ElementPlus)

// 使用路由
app.use(router);

// 错误捕获
app.config.errorHandler = (err, vm, info) => {
    console.error("捕获到错误:", err, info);
    return false;
};

// 挂载应用
app.mount('#app');