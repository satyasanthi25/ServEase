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
        <ul>
          <li v-for="(count, service) in serviceCounts" :key="service">
            {{ service }}: {{ count }}
          </li>
        </ul>
      </div>
    `,
    data() {
        return {
            plotDataService: null,
            plotDataRequest: null,
            serviceCounts: {}
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
                    this.plotDataService = data.plot_data_service;
                    this.plotDataRequest = data.plot_data_request;
                    this.serviceCounts = data.service_counts;
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
        }
    }
};
