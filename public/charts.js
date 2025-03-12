// 配置对象，可根据实际情况修改，这里存储了与图表管理相关的一些配置信息
const config = {
  // API 请求的基础 URL，用于获取图表数据和建立 SSE 连接
  API_BASE_URL: 'http://localhost:3000',
  // 最大重试次数，当 SSE 连接失败时会进行重试，达到该次数后停止重试
  MAX_RETRIES: 5,
  // 重试延迟时间（毫秒），每次重试之间的间隔时间
  RETRY_DELAY: 3000
};

/**
 * ChartManager 类用于管理 ECharts 图表的初始化、数据获取、SSE 连接和错误处理等功能
 */
class ChartManager {
  /**
   * 构造函数，初始化图表管理器的基本属性
   * @param {string} chartId - 图表容器的 ID
   * @param {string} type - 图表类型，如 'order' 或 'user'
   * @param {string} token - 用于身份验证的令牌
   * @param {Object} [option={}] - 可选的 ECharts 配置选项
   */
  constructor(chartId, type, token, option = {}) {
    // 图表容器的 ID，用于查找 DOM 元素
    this.chartId = chartId;
    // 图表类型，决定了获取数据的接口路径
    this.type = type;
    // 身份验证令牌，用于请求数据时的身份验证
    this.token = token;
    // ECharts 图表实例，后续用于操作和更新图表
    this.chart = null;
    // 标记是否已经获取到初始数据
    this.initialDataFetched = false;
    // SSE（Server-Sent Events）连接对象
    this.sseSource = null;
    // 当前重试次数，用于 SSE 连接失败时的重试机制
    this.retryCount = 0;
    // 最大重试次数，从配置对象中获取
    this.maxRetries = config.MAX_RETRIES;
    // 重试延迟时间，从配置对象中获取
    this.retryDelay = config.RETRY_DELAY;
    // 合并默认配置和传入的配置，用于初始化 ECharts 图表
    this.option = {
      title: {
        text: `月度${type === 'order' ? '订单' : '用户'}统计`,
        textStyle: { color: '#333' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '数量',
        type: 'bar',
        barWidth: '60%',
        data: []
      }],
      ...option
    };
  }

  /**
   * 初始化图表，包括创建 ECharts 实例、获取初始数据和建立 SSE 连接
   */
  async init() {
    try {
      // 根据图表容器 ID 获取 DOM 元素
      const chartDom = document.getElementById(this.chartId);
      if (!chartDom) {
        // 如果未找到图表容器，抛出错误并提示
        throw new Error(`未找到图表容器：${this.chartId}`);
      }
      // 初始化 ECharts 图表实例
      this.chart = echarts.init(chartDom);
      // 设置 ECharts 图表的配置选项
      this.chart.setOption(this.option);
      // 异步获取初始数据
      await this.fetchInitialData();
      // 建立 SSE 连接，用于实时更新数据
      this.connectSSE();
    } catch (error) {
      // 初始化过程中出现错误，记录错误信息并显示错误提示
      console.error(`图表${this.chartId}初始化失败:`, error);
      this.showError('图表初始化失败，请刷新页面重试', error.message);
    }
  }

  /**
   * 异步获取初始数据
   */
  async fetchInitialData() {
    try {
      // 构建获取初始数据的 URL
      const url = `${config.API_BASE_URL}/admin/charts/${this.type}?token=${this.token}`;
      // 发起请求获取数据
      const response = await this.fetchData(url);
      const { data } = response;
      // 检查数据是否为空
      if (data.data.months.length === 0) {
        // 若为空，显示提示信息并在 10 秒后重试
        this.showError('暂无数据，10 秒后重试');
        setTimeout(() => this.fetchInitialData(), 10000);
        return;
      }
      // 检查月份和数量数组长度是否一致
      if (data.data.months.length!== data.data.values.length) {
        // 若不一致，显示错误信息并返回
        this.showError('数据格式错误：月份和数量数组长度不匹配');
        return;
      }
      // 更新图表配置中的 x 轴数据
      this.option.xAxis.data = data.data.months;
      // 更新图表配置中的系列数据
      this.option.series[0].data = data.data.values;
      // 标记初始数据已获取
      this.initialDataFetched = true;
      // 更新 ECharts 图表的视图
      this.chart.setOption(this.option);
    } catch (error) {
      // 获取数据过程中出现错误，显示错误提示并在 5 秒后重试
      this.showError('数据加载失败，5 秒后重试', error.message);
      setTimeout(() => this.fetchInitialData(), 5000);
    }
  }

  /**
   * 建立 SSE 连接，监听服务器发送的实时数据
   */
  connectSSE() {
    // 若 SSE 连接已存在且未关闭，先关闭连接
    if (this.sseSource &&!this.sseSource.closed) {
      this.sseSource.close();
    }
    // 构建 SSE 连接的 URL
    const url = `${config.API_BASE_URL}/admin/charts/stream/${this.type}?token=${this.token}`;
    // 创建 SSE 连接对象
    this.sseSource = new EventSource(url);
    // 监听 SSE 消息事件
    this.sseSource.onmessage = (event) => {
      try {
        // 解析服务器发送的数据
        const responseData = JSON.parse(event.data);
        const data = responseData.data || responseData;
        // 检查数据格式是否正确
        if (!data ||!Array.isArray(data.months) ||!Array.isArray(data.values)) {
          // 若格式不正确，显示错误信息并返回
          this.showError('SSE 返回的数据格式不正确，请检查后端接口');
          return;
        }
        // 检查数据是否为空
        if (data.months.length === 0) {
          // 若为空，显示提示信息并返回
          this.showError('暂无数据，请创建订单后查看');
          return;
        }
        // 检查月份和数量数组长度是否一致
        if (data.months.length!== data.values.length) {
          // 若不一致，显示错误信息并返回
          this.showError('SSE 数据格式错误：月份和数量数组长度不匹配');
          return;
        }
        // 更新图表配置中的 x 轴数据
        this.option.xAxis.data = data.months;
        // 更新图表配置中的系列数据
        this.option.series[0].data = data.values;
        // 更新 ECharts 图表的视图
        this.chart.setOption(this.option);
      } catch (parseError) {
        // 解析数据过程中出现错误，记录错误信息并显示错误提示
        console.error('解析 SSE 数据失败:', parseError);
        this.showError('实时数据解析失败，请检查网络或刷新页面', parseError.message);
      }
    };
    // 监听 SSE 连接错误事件
    this.sseSource.onerror = (error) => {
      // 记录错误信息并显示错误提示
      console.error('SSE 连接错误:', error);
      this.showError('实时数据连接中断，正在尝试重连...', error.message);
      // 处理 SSE 连接错误，尝试重新连接
      this.handleSseError();
    };
  }

  /**
   * 处理 SSE 连接错误，进行重试操作
   */
  handleSseError() {
    // 重试次数加 1
    this.retryCount++;
    if (this.retryCount <= this.maxRetries) {
      // 若重试次数未达到最大次数，在指定延迟后重新连接
      setTimeout(() => this.connectSSE(), this.retryDelay);
    } else {
      // 若达到最大重试次数，显示重连失败信息并重置重试次数
      this.showError('重连失败，请手动刷新页面');
      this.retryCount = 0;
    }
  }

  /**
   * 发起网络请求获取数据
   * @param {string} url - 请求的 URL
   * @returns {Promise<Object>} - 返回解析后的 JSON 数据
   */
  async fetchData(url) {
    try {
      // 发起请求
      const response = await fetch(url);
      if (!response.ok) {
        // 若请求失败，抛出错误
        throw new Error(`HTTP ${response.status}`);
      }
      // 检查响应的 Content-Type 是否为 JSON
      const contentType = response.headers.get('content-type');
      if (!contentType ||!contentType.includes('application/json')) {
        throw new Error('响应不是 JSON 格式');
      }
      // 解析响应数据为 JSON
      return await response.json();
    } catch (error) {
      // 请求过程中出现错误，显示错误提示并抛出错误
      this.showError('网络请求出错', error.message);
      throw error;
    }
  }

  /**
   * 显示错误信息并更新图表标题
   * @param {string} message - 错误消息
   * @param {string} [errorCode=null] - 可选的错误代码
   */
  showError(message, errorCode = null) {
    // 创建错误提示的 DOM 元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
            ${message}
            ${errorCode? `<small>错误码: ${errorCode}</small>` : ''}
            <button onclick="this.parentElement.remove()">关闭</button>
        `;
    // 将错误提示添加到页面顶部
    document.body.prepend(errorDiv);
    // 清空图表系列数据，保留基础图表样式
    this.option.series[0].data = [];
    // 更新 ECharts 图表的视图
    this.chart.setOption(this.option);
  }

  /**
   * 销毁图表和 SSE 连接，释放资源
   */
  destroy() {
    if (this.chart) {
      // 销毁 ECharts 图表实例
      this.chart.dispose();
      this.chart = null;
    }
    if (this.sseSource &&!this.sseSource.closed) {
      // 关闭 SSE 连接
      this.sseSource.close();
    }
  }
}

// 将 ChartManager 类暴露到全局，方便在其他地方使用
window.ChartManager = ChartManager;