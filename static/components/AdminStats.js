export default {
  template: `
    <div class="mt-3">
      <div class="row">
        <div class="col-lg-6" ref="plotContainerRequest">
          <h5>Number Of Requests</h5>
        </div>
        <div class="col-lg-6" ref="plotContainerService">
          <h5>Total Services</h5>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-lg-12" ref="plotContainerUserStats">
          <h5>User Statistics</h5>
        </div>
      </div>
      
      <ul>
        <li v-for="(count, service) in serviceCounts" :key="service">
          {{ service }}: {{ count }}
        </li>
      </ul>
      
      <div class="row">
        <!-- Total Visits Card -->
        <div class="col-md-4">
          <div class="card text-center mb-3 shadow">
            <div class="card-body">
              <h5 class="card-title">Total User Visits Of ServEase</h5>
              <p class="card-text display-4">{{ total_visits }}</p>
            </div>
          </div>
        </div>
        
        <!-- Visits Per Day Card -->
        <div>
          <div class="col-md-4">
            <div class="card text-center mb-3 shadow">
              <div class="card-body">
                <h5 class="card-title">User Visits Per Day</h5>
                <ul v-if="data1 && data1.length">
                  <li v-for="(visit, index) in data1" :key="index">
                   Date: {{ visit.date }}: {{ visit.count }} visits
                  </li>
                </ul>
                <p v-else>No visits recorded yet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  `,
  data() {
    return {
      plotDataService: null,
      plotDataRequest: null,
      plotDataUserStats: null,
      serviceCounts: {},
      data1: [], 
      total_visits: null,
    };
  },
  mounted() {
    this.fetchGraphData();
  },
  methods: {
    fetchGraphData() {
      fetch('/api/admin/report')
        .then(response => response.json())
        .then(data => {
          console.log("API Response:", data); // Debugging API response
          this.plotDataService = data.plot_data_service;
          this.plotDataRequest = data.plot_data_request;
          this.plotDataUserStats = data.plot_data_user_stats;
          this.serviceCounts = data.service_counts;
          this.data1 = data.data1 || []; // Assign only the 'data1' field
          this.total_visits = data.total_visits || 0; 
          this.renderGraph();
        })
        .catch(error => {
          console.error('Error fetching graph data:', error);
        });
    },
    renderGraph() {
      if (this.plotDataRequest) {
        const imgRequest = new Image();
        imgRequest.style.width = '100%';
        imgRequest.src = 'data:image/png;base64,' + this.plotDataRequest;
        this.$refs.plotContainerRequest.appendChild(imgRequest);
      } else {
        console.error('No plot data for requests.');
      }

      if (this.plotDataService) {
        const imgService = new Image();
        imgService.style.width = '100%';
        imgService.src = 'data:image/png;base64,' + this.plotDataService;
        this.$refs.plotContainerService.appendChild(imgService);
      } else {
        console.error('No plot data for services.');
      }

      if (this.plotDataUserStats) {
        const imgUserStats = new Image();
        imgUserStats.style.width = '100%';
        imgUserStats.src = 'data:image/png;base64,' + this.plotDataUserStats;
        this.$refs.plotContainerUserStats.appendChild(imgUserStats);
      } else {
        console.error('No plot data for user statistics.');
      }
    }
  }
};
