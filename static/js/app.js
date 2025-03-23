// Vue.js 组件
const ObjectSelection = {
  template: `
    <div style="padding: 20px;">
      <!-- 对象选择页面 -->
      <h1>选择对象</h1>

      <el-select 
        v-model="selectedObjectId" 
        placeholder="请选择对象" 
        style="width: 100%; margin-bottom: 20px;"
      >
        <el-option
          v-for="object in objects"
          :key="object.id"
          :label="object.label"
          :value="object.id"
        />
      </el-select>

      <el-button 
        type="success" 
        @click="goToAccountList" 
        :disabled="!selectedObjectId"
      >
        进入列表
      </el-button>
    </div>
  `,
  data() {
    return {
      objects: [],
      selectedObjectId: ''
    };
  },
  created() {
    this.fetchObjects();
  },
  methods: {
    async fetchObjects() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/objects/');
        this.objects = response.data;
      } catch (error) {
        console.error('获取对象失败', error);
      }
    },
    goToAccountList() {
      if (this.selectedObjectId) {
        this.$router.push(`/account-list/${this.selectedObjectId}`);
      }
    }
  }
};
const AccountList = {
  template: `
    <div class="account-list" style="padding: 20px;">
      <!-- 账户列表页面 -->
      <h1>{{ pageListTitle }}</h1>

      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索账户名称"
        style="margin-bottom: 20px;"
      />

      <!-- 表格区域 -->
      <div class="table-container">
        <el-skeleton v-if="loading" :rows="6" animated />
        <el-table v-else :data="accounts" style="width: 100%" @sort-change="handleSortChange">
          <el-table-column
            v-for="key in filteredColumns"
            :key="key"
            :prop="key" 
            :label="formatLabel(key)"
            :sortable="true"
          />
            <template #header="{ column }">
              <span>{{ formatLabel(column.property) }}</span>
              <el-button
                v-if="column.property === 'account_name'"
                icon="el-icon-sort"
                @click="sortByColumn(column.property)"
              ></el-button>
            </template>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button type="primary" @click="viewDetails(row.id)">详情</el-button>
              <el-button type="warning" @click="editAccount(row.id)">编辑</el-button>
              <el-button type="danger" @click="deleteAccount(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 底部固定区域 -->
      <div class="footer">

        <!-- 分页 -->
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          @current-change="handlePageChange"
        />

        <!-- 按钮组 -->
        <div class="button-group" style="display: flex; gap: 10px; margin-top: 20px;">
          <el-button type="success" @click="createAccount">新建</el-button>
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      pageListTitle: '',
      pagelistId: '',
      accounts: [],
      searchQuery: '',
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,
      loading: false,
      sortField: 'account_name',
      sortOrder: 'asc',
    };
  },
  computed: {
    // 计算属性：获取过滤后的列名，隐藏 id
    filteredColumns() {
      if (this.accounts.length === 0) return [];
      const columns = Object.keys(this.accounts[0]);
      return ['account_name', ...columns.filter(key => key !== 'account_name' && key !== 'id')];
    },
  },
  created() {
    this.fetchPageList();
    this.fetchAccounts();
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.fetchAccounts();
    }
  },
  methods: {
    async fetchPageList() {
      this.loading = true;
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/page-lists/`);
        this.pagelistId = response.data[0]?.id || '';
        this.pageListTitle = response.data[0]?.label || "未配置页面";
      } catch (error) {
        console.error('获取 PageList 名称失败', error);
      }
      this.loading = false;
    },
    async fetchAccounts() {
      this.loading = true;
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/main/', {
          params: {
            object_id: this.$route.params.objectId || '',
            search: this.searchQuery.trim() || '',
            page: this.currentPage || 1,
            page_size: this.pageSize || 20,
            sort_field: this.sortField,
            sort_order: this.sortOrder,
          }
        });
        // 处理删除最后一条数据的情况
        if (response.data.results.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          await this.fetchAccounts();
          return;
        }
        this.accounts = response.data.results;
        this.totalCount = response.data.count;
      } catch (error) {
        console.error('获取账户失败', error);
        this.$message.error('数据加载失败');
      } finally {
        this.loading = false;
      }
    },
    formatLabel(key) {
      const labelMap = {
        account_name: '账户名称',
        department: '部门',
        hospital: '医院',
      };
      return labelMap[key] || key;  // 默认返回字段名
    },
    // 分页处理
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchAccounts();
    },
    // 创建账户
    createAccount() {
      this.$router.push({
        path: `/account/create`,
        query: {
          object_id: this.$route.params.objectId,
        }
      });
    },
    // 详情跳转
    viewDetails(accountId) {
      this.$router.push({
        path: `/account/${accountId}`,
        query: {
          pagelist_id: this.pagelistId,
        }
      });
    },
    // 编辑跳转
    editAccount(accountId) {
      this.$router.push({
        path: `/account/edit/${accountId}`,
        query: {
          pagelist_id: this.pagelistId,
        }
      });
    },
    // 删除账户
    async deleteAccount(accountId) {
      try {
        await this.$confirm('确定删除该账户？此操作不可逆！', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
      });
        const response = await axios.delete(`http://127.0.0.1:8000/api/main/${accountId}/`);
        if (response.status === 204) {
          this.$message.success("删除成功！");
          if (this.accounts.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          await this.fetchAccounts();
        }
      } catch (error) {
        console.error('删除账户失败', error);
        if (error !== 'cancel') {  // 用户点击取消不视为错误
          return;
        }
        if (error.response) {
          switch (error.response.status) {
            case 404:
              this.$message.error("账户不存在！");
              break;
            case 500:
              this.$message.error("服务器错误，请重试！");
              break;
            default:
              this.$message.error("删除失败，请重试！");
          }
        } else if (error.request) {
          this.$message.error("网络错误，请检查连接！");
        }
      }
    },
    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },
    handleSortChange({ column, prop, order }) {
      if (prop) {
        this.sortField = prop;
        this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
        this.fetchAccounts();
      }
    },
    sortByColumn(column) {
      if (this.sortField === column) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = column;
        this.sortOrder = 'asc';
      }
      this.fetchAccounts();
    },
  },
};

const RetrieveAccount = {
  template: `
    <div class="account-details">
      <h1 class="page-title">{{ pageLayoutName }}</h1>
      
      <!-- 加载状态 -->
      <div class="details-container">
        <el-skeleton v-if="loading" :rows="6" animated />
        <el-table v-else :data="accountTableData" border style="width: 100%">
          <el-table-column prop="key" label="属性" width="200" />
          <el-table-column prop="value" label="值" />
        </el-table>
      </div>

        <!-- 返回按钮 -->
        <div class="button-group" style="display: flex; gap: 10px; margin-top: 20px;">
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
    </div>
  `,
  data() {
    return {
      pageLayoutName: "",
      accountData: {},
      loading: true,
      accountTableData: [],
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const accountId = this.$route.params.id;
        const pagelistId = this.$route.query.pagelist_id;
        const response = await axios.get(`http://127.0.0.1:8000/api/main/${accountId}/`, {
          params: { pagelist_id: pagelistId }
        });
        this.pageLayoutName = response.data.page_layout.name || "账户详情";
        this.accountData = response.data.filtered_data;
        this.accountTableData = Object.entries(this.accountData).map(([key, value]) => ({
          key,
          value,
        }));
      } catch (error) {
        console.error("获取数据失败", error);
        this.handleError(error);
      }
      this.loading = false;
    },
    handleError(error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            this.$message.error("数据不存在！");
            break;
          case 500:
            this.$message.error("服务器错误，请重试！");
            break;
          default:
            this.$message.error("获取数据失败，请重试！");
        }
      } else {
        this.$message.error("网络错误，请检查连接！");
      }
    },
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
      <el-card style="margin-bottom: 20px;">
        <h2>Account</h2>
        <el-form-item v-for="(value, key) in formData" :key="key">
          <template #label>
            <span v-if="isRequiredField(key)" style="color: red;">*</span> {{ formatLabel(key) }}
          </template>
          <el-input v-model="formData[key]" placeholder="请输入内容" style="width: 80%;"/>
          <el-button v-if="key !== 'account_name'" type="danger" @click="removeField(key)" style="margin-left: 10px;" >删除</el-button>
        </el-form-item>

        <!-- 新增字段输入框 -->
        <el-form-item label="新增(选填)">
          <el-input v-model="newFieldName" placeholder="字段名称" style="width: 39%;" />
          <el-input v-model="newFieldValue" placeholder="字段值" style="width: 40%; margin-left: 10px;" />
          <el-button @click="addField" style="margin-left: 10px;">➕</el-button>
        </el-form-item>
      </el-card>

      <el-button type="primary" @click="submitForm" style="margin-top: 20px">创建</el-button>
      <el-button @click="goBack" style="margin-top: 20px">返回</el-button>
    </el-form>
  </div>
  `,
  data() {
    return {
      formData: {
        account_name: "",
        department: "",
        hospital: "",
        phone: ""
      },
      newFieldName: "",
      newFieldValue: ""
    };
  },
  methods: {
    // 格式化标签
    formatLabel(key) {
      const labelMap = {
        account_name: '账户名称',
        department: '部门',
        hospital: '医院',
        phone: '电话',
      };
      return labelMap[key] || key;
    },
    isRequiredField(key) {
      return ["account_name"].includes(key);
    },
    // 添加新字段
    addField() {
      if (!this.newFieldName.trim()) {
        this.$message.error("字段名称不能为空！");
        return;
      }
      if (this.formData.hasOwnProperty(this.newFieldName)) {
        this.$message.error("字段已存在！");
        return;
      }
      this.formData[this.newFieldName] = this.newFieldValue;
      this.newFieldName = "";
      this.newFieldValue = "";
    },
    removeField(key) {
      if (key === 'account_name') {
        this.$message.warning("账户名称不能删除！");
        return;
      }
      const { [key]: _, ...newData } = this.formData;
      this.formData = newData;
    },  
    goBack() {
      this.$router.go(-1);
    },
    handleError(error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            this.$message.error("数据不存在！");
            break;
          case 500:
            this.$message.error("服务器错误，请重试！");
            break;
          default:
            this.$message.error("获取数据失败，请重试！");
        }
      } else {
        this.$message.error("网络错误，请检查连接！");
      }
    },
    async submitForm() {
      if (!this.formData.account_name?.trim()) {
        return this.$message.error("账户名称是必填项！");
      }
      try {
        const objectId = this.$route.query.object_id;
        const requestData = {
          object_id: objectId,
          data: this.formData
        };
        const response = await axios.post('http://127.0.0.1:8000/api/main/', requestData);
        if (response.status === 201) {
          this.$message.success("创建成功！");
          this.$router.go(-1);
        }
      } catch (error) {
        console.error("创建失败:", error);
        this.handleError(error);
      }
    },
  },
};

const UpdateAccount = {
  template: `
  <div>
    <h1>编辑账户</h1>
    <el-form :model="formData" label-width="120px">
      <el-card style="margin-bottom:20px;">
        <h2>Account</h2>
        <el-form-item v-for="(value, key) in formData" :key="key">
          <template #label>
            <span v-html="formatLabel(key)"></span>
          </template>
          <el-input v-model="formData[key]" />
          <span v-if="checkField(key, value)" style="color: red;">不能为空！</span>
        </el-form-item>
      </el-card>

      <el-button type="primary" @click="submitForm" style="margin-top:20px">保存</el-button>
      <el-button @click="goBack" style="margin-top:20px">返回</el-button>
    </el-form>
  </div>
  `,
  data() {
    return {
      formData: {},
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    // 格式化标签
    formatLabel(key) {
      const requiredFields = ["account_name"]; 
      const labelMap = {
        account_name: '账户名称',
        department: '部门',
        hospital: '医院',
        phone: '电话',
      };
      return requiredFields.includes(key) 
        ? `<span style="color: red;">*</span> ${labelMap[key] || key}` 
        : labelMap[key] || key;
    },
    checkField(key, value) {
      const requiredFields = ["account_name"];
      return requiredFields.includes(key) && !value;
    },
    // 获取数据
    async fetchData() {
      try {
        const accountId = this.$route.params.id;
        const pagelistId = this.$route.query.pagelist_id;
        const response = await axios.get(`http://127.0.0.1:8000/api/main/${accountId}/`,{
          params: { pagelist_id: pagelistId }
        });
        this.formData = response.data.account_data; 
        this.loading = false;
      } catch (error) {
        console.error("获取数据失败:", error);
        this.handleError(error);
      }
    },
    // 提交表单
    async submitForm() {
      if (!this.formData.account_name?.trim()) {
        return this.$message.error("账户名称是必填项！");
      }
      try {
        const accountId = this.$route.params.id;
        const requestData = { ...this.formData };
        const response = await axios.put(`http://127.0.0.1:8000/api/main/${accountId}/`, requestData);
        if (response.status === 200) {
          this.$message.success("更新成功！");
          this.$router.go(-1);
        }
      } catch (error) {
        console.error("更新失败:", error);
        this.handleError(error);
      }
    },
    goBack() {
      this.$router.go(-1);
    },
    handleError(error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            this.$message.error("数据不存在！");
            break;
          case 500:
            this.$message.error("服务器错误，请重试！");
            break;
          default:
            this.$message.error("获取数据失败，请重试！");
        }
      } else {
        this.$message.error("网络错误，请检查连接！");
      }
    },
  },
};

const NotFound = { template: '<div>404 Not Found</div>' };

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [
    {
      path: '/',
      component: ObjectSelection,
    },
    {
      path: '/account-list/:objectId',
      component: AccountList,
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

app.use(router);

app.config.errorHandler = (err, vm, info) => {
  console.error("捕获到错误:", err, info);
  return false;
};

// 挂载应用
app.mount('#app');