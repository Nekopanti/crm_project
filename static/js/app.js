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
    <div style="padding: 20px;">
      <!-- 账户列表页面 -->
      <div>
        <h1>{{ pageListTitle }}</h1>

        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索账户名称"
          @input="debouncedFilterAccounts"
          style="margin-bottom: 20px;"
        />

        <el-skeleton v-if="loading" :rows="6" animated />

        <el-table v-else :data="filteredAccounts" style="width: 100%" row-key="id">
          <el-table-column
            v-for="(value, key) in filteredAccounts[0]"
            :key="key"
            :prop="key"
            :label="formatLabel(key)"
          />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button type="primary" @click="viewDetails(row.id)">详情</el-button>
              <el-button type="warning" @click="editAccount(row.id)">编辑</el-button>
              <el-button type="danger" @click="deleteAccount(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          style="margin-top: 20px;"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          @current-change="handlePageChange"
        />
        <div style="display: flex; align-items: center; margin-top: 20px;">
          <el-button type="success" @click="createAccount">新建</el-button>
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      pageListTitle: '',
      accounts: [],
      searchQuery: '',
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,
      loading: false,
      filteredAccounts: [],
    };
  },
  created() {
    this.fetchPageList();
    this.fetchAccounts();
    this.debouncedFilterAccounts = this.debounce(this.filterAccounts.bind(this), 300);
  },
  methods: {
    async fetchPageList() {
      this.loading = true;
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/page-lists/`);
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
            search: this.searchQuery || '',
            page: this.currentPage || 1,
            page_size: this.pageSize || 20,
          }
        });
        this.accounts = response.data.results;
        console.log(this.accounts);
        this.filteredAccounts = [...this.accounts];
        console.log(this.filteredAccounts[0]);
        this.totalCount = response.data.count;
      } catch (error) {
        console.error('获取账户失败', error);
      }
      this.loading = false;
    },
    filterAccounts() {
      if (!this.searchQuery) {
        this.filteredAccounts = [...this.accounts];
        this.totalCount = this.accounts.length;
      } else {
        const searchTerm = this.searchQuery.toLowerCase();
        this.filteredAccounts = this.accounts.filter(account => {
          return account.account_name.toLowerCase().includes(searchTerm);
        });
        this.totalCount = this.filteredAccounts.length;
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
    debounce(func, wait) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), wait);
      };
    },
    // ✅ 分页处理
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchAccounts();
    },
    // 创建账户
    createAccount() {
      this.$router.push('/account/create');
    },
    // ✅ 详情跳转
    viewDetails(accountId) {
      this.$router.push(`/account/${accountId}`);
    },
    // ✅ 编辑跳转
    editAccount(accountId) {
      this.$router.push(`/account/edit/${accountId}`);
    },
    // 删除账户
    async deleteAccount(accountId) {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/main/${accountId}/`);
        if (response.status === 204) {
          this.$message.success("删除成功！");
          this.fetchAccounts(); // 重新加载账户列表
        }
      } catch (error) {
        console.error('删除账户失败', error);
        if (error.response) {
          // 根据后端返回的状态码显示不同的错误消息
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
        } else {
          this.$message.error("网络错误，请检查连接！");
        }
      }
    },
    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },
    handleSortChange({ column, prop, order }) {
      if (prop === 'name') {
        this.sortField = prop;
        this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
      } else {
        this.sortField = null;
      }
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
        const response = await axios.get(`http://127.0.0.1:8000/api/main/${accountId}/`);
        this.pageList = response.data.page_list;
        this.pageListFields = response.data.page_list_fields;
        this.pageLayouts = response.data.page_layout;
        this.pageLayoutFields = response.data.page_layout_fields;
      } catch (error) {
        console.error('获取数据失败', error);
        if (error.response) {
          switch (error.response.status) {
            case 404:
              this.$message.error("账户不存在！");
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
          <el-table :data="formData.object" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column prop="label" label="Label">
              <template #default="scope">
                <el-input v-model="scope.row.label" />
              </template>
            </el-table-column>
            <el-table-column prop="table_name" label="Table Name">
              <template #default="scope">
                <el-input v-model="scope.row.table_name" />
              </template>
            </el-table-column>
            <el-table-column prop="deleted" label="Deleted">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.deleted"
                  active-value="1"
                  inactive-value="0"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- ObjectField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Object Field</h2>
          <el-table :data="formData.objectFields" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type">
              <template #default="scope">
                <el-select v-model="scope.row.type">
                  <el-option label="Text" value="text" />
                  <el-option label="String" value="string" />
                  <el-option label="Number" value="number" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="Deleted">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.deleted"
                  active-value="1"
                  inactive-value="0"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button @click="removeRow('objectFields', scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button @click="addRow('objectFields')" style="margin-top:10px">+ 新增字段</el-button>
        </el-card>

        <!-- PageList 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List</h2>
          <el-table :data="[formData.pageList]" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column prop="label" label="Label">
              <template #default="scope">
                <el-input v-model="scope.row.label" />
              </template>
            </el-table-column>
            <el-table-column label="Deleted">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.deleted"
                  active-value="1"
                  inactive-value="0"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- PageListField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page List Field</h2>
          <el-table :data="formData.pageListFields" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column label="Hidden">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.hidden"
                  active-value="1"
                  inactive-value="0"
                />
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type">
              <template #default="scope">
                <el-select v-model="scope.row.type">
                  <el-option label="Text" value="text" />
                  <el-option label="String" value="string" />
                  <el-option label="Number" value="number" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button @click="removeRow('pageListFields', scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button @click="addRow('pageListFields')" style="margin-top:10px">+ 新增字段</el-button>
        </el-card>

        <!-- PageLayout 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layout</h2>
          <el-table :data="formData.pageLayout" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column label="Deleted">
              <template #default="scope">
                <el-switch 
                  v-model="scope.row.deleted"
                  active-value="1"
                  inactive-value="0"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- PageLayoutField 表单 -->
        <el-card style="margin-bottom: 20px;">
          <h2>Page Layout Field</h2>
          <el-table :data="formData.pageLayoutFields" border>
            <el-table-column prop="name" label="Name">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span style="color: red; margin-right: 5px;">*</span>
                  <el-input
                  v-model="scope.row.name"
                  @change="checkName(scope.row)"
                  />
                </div>
                <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
              </template>
            </el-table-column>
            <el-table-column prop="label" label="Label">
              <template #default="scope">
                <el-input v-model="scope.row.label" />
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type">
              <template #default="scope">
                <el-select v-model="scope.row.type">
                  <el-option label="Text" value="text" />
                  <el-option label="String" value="string" />
                  <el-option label="Number" value="number" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button @click="removeRow('pageLayoutFields', scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button @click="addRow('pageLayoutFields')" style="margin-top:10px">+ 新增字段</el-button>
        </el-card>

        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="goBack">返回</el-button>
      </el-form>
    </div>
  `,
  data() {
    return {
      formData: {
        object: [
          {
            name: "",
            label: "",
            table_name: "",
            deleted: "0",
          },
        ],
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
        pageLayout: [
          {
            name: "",
            deleted: "0",
          },
        ],
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
    addRow(tableType) {
      const baseData = {
        objectFields: { name: '', type: '', deleted: '0' },
        pageListFields: { name: '', hidden: '0', type: '' },
        pageLayout: { name: '', deleted: '0' },
        pageLayoutFields: { name: '', label: '', type: '', deleted: '0' }
      }
      this.formData[tableType].push({ ...baseData[tableType] })
    },
    removeRow(tableType, index) {
      this.formData[tableType].splice(index, 1)
    },
    goBack() {
      this.$router.go(-1);
    },
    async submitForm() {
      let isValid = true;

      if (!this.formData.pageList.name) {
        this.formData.pageList.showError = true;
        isValid = false;
      } else {
        this.formData.pageList.showError = false;
      }
      this.formData.object.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.objectFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageListFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageLayout.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageLayoutFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      if (!isValid) {
        this.$message.error("请填写所有必填项！");
        return;
      }
      try {
        const requestData = {
          object: this.formData.object || [{ name: "", label: "", table_name: "", deleted: "0" }],
          object_fields: this.formData.objectFields || [{ name: "", type: "", deleted: "0" }],
          page_list: this.formData.pageList || { name: "", label: "", deleted: "0" },
          page_list_fields: this.formData.pageListFields || [{ name: "", hidden: "0", type: "", deleted: "0" }],
          page_layout: this.formData.pageLayout || [{ name: "", deleted: "0" }],
          page_layout_fields: this.formData.pageLayoutFields || [{ name: "", label: "", type: "", deleted: "0" }],
        };
        const response = await axios.post('http://127.0.0.1:8000/api/main/', requestData);
        if (response.status === 201) {
          this.$message.success("创建成功！");
          this.$router.push("/"); // 返回账户列表
          this.resetForm(); // 清空表单
        }
      } catch (error) {
        console.error("创建失败:", error);
        if (error.response) {
          switch (error.response.status) {
            case 404:
              this.$message.error("账户不存在！");
              break;
            case 500:
              this.$message.error("服务器错误，请重试！");
              break;
            default:
              this.$message.error("创建失败，请重试！");
          }
        } else {
          this.$message.error("网络错误，请检查连接！");
        }
      }
    },
    resetForm() {
      this.formData = {
        object: [
          {
            name: "",
            label: "",
            table_name: "",
            deleted: "0",
          },
        ],
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
        pageLayout: [
          {
            name: "",
            deleted: "0",
          },
        ],
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
      <!-- Object 表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Object</h2>
        <el-table :data="formData.object" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column prop="label" label="Label">
            <template #default="scope">
              <el-input v-model="scope.row.label" />
            </template>
          </el-table-column>
          <el-table-column prop="table_name" label="Table Name">
            <template #default="scope">
              <el-input v-model="scope.row.table_name" />
            </template>
          </el-table-column>
          <el-table-column prop="deleted" label="Deleted">
            <template #default="scope">
              <el-switch 
                v-model="scope.row.deleted"
                active-value="1"
                inactive-value="0"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- ObjectField 可编辑表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Object Field</h2>
        <el-table :data="formData.objectFields" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="Type">
            <template #default="scope">
              <el-select v-model="scope.row.type">
                <el-option label="Text" value="text" />
                <el-option label="String" value="string" />
                <el-option label="Number" value="number" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="Deleted">
            <template #default="scope">
              <el-switch 
                v-model="scope.row.deleted"
                active-value="1"
                inactive-value="0"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- PageList 可编辑表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Page List</h2>
        <el-table :data="[formData.pageList]" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column prop="label" label="Label">
            <template #default="scope">
              <el-input v-model="scope.row.label" />
            </template>
          </el-table-column>
          <el-table-column label="Deleted">
            <template #default="scope">
              <el-switch 
                v-model="scope.row.deleted"
                active-value="1"
                inactive-value="0"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- PageListField 可编辑表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Page List Field</h2>
        <el-table :data="formData.pageListFields" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column label="Hidden">
            <template #default="scope">
              <el-switch 
                v-model="scope.row.hidden"
                active-value="1"
                inactive-value="0"
              />
            </template>
          </el-table-column>
          <el-table-column prop="type" label="Type">
            <template #default="scope">
              <el-select v-model="scope.row.type">
                <el-option label="Text" value="text" />
                <el-option label="String" value="string" />
                <el-option label="Number" value="number" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- PageLayout 可编辑表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Page Layout</h2>
        <el-table :data="formData.pageLayout" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column label="Deleted">
            <template #default="scope">
              <el-switch 
                v-model="scope.row.deleted"
                active-value="1"
                inactive-value="0"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- PageLayoutField 可编辑表格 -->
      <el-card style="margin-bottom:20px;">
        <h2>Page Layout Field</h2>
        <el-table :data="formData.pageLayoutFields" border>
          <el-table-column prop="name" label="Name">
            <template #default="scope">
              <div style="display: flex; align-items: center;">
                <span style="color: red; margin-right: 5px;">*</span>
                <el-input
                v-model="scope.row.name"
                @change="checkName(scope.row)"
                />
              </div>
              <div v-if="scope.row.showError" style="color: red; margin-top: 5px;">名称不能为空！</div>
            </template>
          </el-table-column>
          <el-table-column prop="label" label="Label">
            <template #default="scope">
              <el-input v-model="scope.row.label" />
            </template>
          </el-table-column>
          <el-table-column prop="type" label="Type">
            <template #default="scope">
              <el-select v-model="scope.row.type">
                <el-option label="Text" value="text" />
                <el-option label="String" value="string" />
                <el-option label="Number" value="number" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-button type="primary" @click="submitForm" style="margin-top:20px">保存</el-button>
      <el-button @click="goBack" style="margin-top:20px">返回</el-button>
    </div>
  `,
  data() {
    return {
      formData: {
        object: [
          {
            name: "",
            label: "",
            table_name: "",
            deleted: "0",
          },
        ],
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
        pageLayout: [
          {
            name: "",
            deleted: "0",
          },
        ],
        pageLayoutFields: [
          {
            name: "",
            label: "",
            type: "",
            deleted: "0",
          },
        ],
      },
      loading: true,
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },
    // // 通用行操作方法
    // saveRow(tableType, row) {
    //   console.log('保存:', tableType, row)
    //   // 此处调用API保存数据[9](@ref)
    // },
    removeRow(tableType, index) {
      this.formData[tableType].splice(index, 1)
    },
    // addRow(tableType) {
    //   const baseData = {
    //     objectFields: { name: '', type: 'string', deleted: '0' },
    //     pageListFields: { name: '', hidden: '0', type: 'text' },
    //     pageLayout: { name: '', deleted: '0' },
    //     pageLayoutFields: { name: '', label: '', type: 'input', deleted: '0' }
    //   }
    //   this.formData[tableType].push({ ...baseData[tableType] })
    // },
    // // 递归移除所有 id 字段
    // removeIds(data) {
    //   if (data === null || data === undefined) {
    //     return data;
    //   }

    //   // 处理数组：递归处理每个元素
    //   if (Array.isArray(data)) {
    //     return data.map(item => this.removeIds(item));
    //   }

    //   // 处理对象：移除指定字段
    //   if (typeof data === 'object') {
    //     return Object.keys(data).reduce((acc, key) => {
    //       // 需要删除的字段列表
    //       const forbiddenKeys = [
    //         'id',           // 所有主键ID
    //         'object',        // Object关联对象
    //         'object_field',  // ObjectField关联对象
    //         'page_list',     // PageList关联对象
    //         'page_layout'    // PageLayout关联对象
    //       ];

    //       // 仅保留不在黑名单中的字段
    //       if (!forbiddenKeys.includes(key)) {
    //         acc[key] = this.removeIds(data[key]);
    //       }
    //       return acc;
    //     }, {});
    //   }

    //   // 基本类型直接返回
    //   return data;
    // },
    // 获取数据
    async fetchData() {
      try {
        const accountId = this.$route.params.id;
        const response = await axios.get(`http://127.0.0.1:8000/api/main/${accountId}/`);
        // console.log(response.data);
        // console.log("object:", response.data.object);
        // console.log("page_layout:", response.data.page_layout);
        this.formData = {
          object: response.data.object || [{ name: "", label: "", table_name: "", deleted: "0" }],
          objectFields: response.data.object_fields || [{ name: "", type: "", deleted: "0" }],
          pageList: response.data.page_list || { name: "", label: "", deleted: "0" },
          pageListFields: response.data.page_list_fields || [{ name: "", hidden: "0", type: "", deleted: "0" }],
          pageLayout: response.data.page_layout || [{ name: "", deleted: "0" }],
          pageLayoutFields: response.data.page_layout_fields || [{ name: "", label: "", type: "", deleted: "0" }],
        };
        this.loading = false;// 填充表单数据
      } catch (error) {
        console.error("获取数据失败:", error);
        if (error.response) {
          switch (error.response.status) {
            case 404:
              this.$message.error("账户不存在！");
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
      }
    },
    // 提交表单
    async submitForm() {
      let isValid = true;

      if (!this.formData.pageList.name) {
        this.formData.pageList.showError = true;
        isValid = false;
      } else {
        this.formData.pageList.showError = false;
      }
      this.formData.object.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.objectFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageListFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageLayout.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      this.formData.pageLayoutFields.forEach(item => {
        if (!item.name) {
          item.showError = true;
          isValid = false;
        } else {
          item.showError = false;
        }
      });

      if (!isValid) {
        this.$message.error("请填写所有必填项！");
        return;
      }
      try {
        const accountId = this.$route.params.id;
        // console.log('提交数据:', this.formData.object);
        // const requestData = {
        //   object: this.removeIds(this.formData.object),
        //   object_fields: this.removeIds(this.formData.objectFields),
        //   page_list: this.removeIds(this.formData.pageList),
        //   page_list_fields: this.removeIds(this.formData.pageListFields),
        //   page_layout: this.removeIds(this.formData.pageLayout),
        //   page_layout_fields: this.removeIds(this.formData.pageLayoutFields),
        // };
        const requestData = {
          object: this.formData.object,
          object_fields: this.formData.objectFields,
          page_list: this.formData.pageList,
          page_list_fields: this.formData.pageListFields,
          page_layout: this.formData.pageLayout,
          page_layout_fields: this.formData.pageLayoutFields,
        };
        // console.log('提交数据:', requestData);
        // console.log('提交数据:', requestData.object);
        // console.log('提交数据:', requestData.object_fields);
        // console.log('提交数据:', requestData.page_list);
        // console.log('提交数据:', requestData.page_list_fields);
        // console.log('提交数据:', requestData.page_layout);
        // console.log('提交数据:', requestData.page_layout_fields);
        const response = await axios.put(`http://127.0.0.1:8000/api/main/${accountId}/`, requestData);
        if (response.status === 200) {
          this.$message.success("更新成功！");
          this.$router.push("/");
        }
      } catch (error) {
        console.error("更新失败:", error);
        if (error.response) {
          switch (error.response.status) {
            case 404:
              this.$message.error("账户不存在！");
              break;
            case 500:
              this.$message.error("服务器错误，请重试！");
              break;
            default:
              this.$message.error("更新失败，请重试！");
          }
        } else {
          this.$message.error("网络错误，请检查连接！");
        }
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