export default ({
    data: () => ({
        bootstrap_modal: {},
        serviceInfo: {
            service: '',
            requests: []
        },
        role: localStorage.getItem('role'),
    }),
    methods: {
        async fetchAndUpdate(url, service_id) {
            const res = await fetch(url, {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            });
            if (res.ok) {
                this.getServiceDetails(service_id);
            }
        },
        
        
        viewModal(service) {
            this.serviceInfo = service;
            this.getServiceDetails(service.service_id);
            this.bootstrap_modal.show();
        },
        
        async getServiceDetails(service_id) {
            const res = await fetch(`/api/service/${service_id}`, {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                method: 'GET',
            });
            if (res.ok) {
                this.serviceInfo = await res.json();
            }
        },
        
    },
    
    mounted() {
        this.bootstrap_modal = new bootstrap.Modal(document.getElementById('viewServiceDetailsModal'));
    },
    
    computed: {
        imagePath() {
            return this.serviceInfo.image ? `static/upload/${this.serviceInfo.image}` : "static/images/e.jpg";
        }
    },
    
    template: `
  
<div>
    <div class="modal fade" id="viewServiceDetailsModal" tabindex="-1" aria-labelledby="viewServiceDetailsModalLabel"
         aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="viewServiceDetailsModalLabel">Service Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-lg-5 text-center mx-auto">
                            <div class="mx-auto">
                                <img class="mx-auto" :alt="serviceInfo.service_name" style="max-width: 100%; height: 500px"
                                     :src="imagePath"/>
                            </div>
                        </div>

                        <div class="col-lg-7">
                            <div class="clearfix">
                                <div class="float-start">
                                    <h2>
                                        {{ serviceInfo.service_name }}
                                    </h2>
                                </div>
                                <div class="float-end" v-if="role === 'admin'">
                                    <router-link class="text-white" :to="'/edit-service/'+serviceInfo.service_id">
                                        <button class="btn btn-primary" data-bs-dismiss="modal">
                                            Edit/Manage Service
                                        </button>
                                    </router-link>
                                </div>
                                <div class="float-end" v-if="role === 'customer'">
                                    <router-link class="text-white" :to="'/book/'+serviceInfo.service_id">
                                        <button class="btn btn-warning" data-bs-dismiss="modal">
                                            View
                                        </button>
                                    </router-link>
                                </div>
                            </div>

                            <ul class="nav nav-tabs" id="myTab" role="tablist">
                                <li class="nav-item" role="presentation" v-if="role === 'admin'">
                                    <button class="nav-link" id="profile-tab" data-bs-toggle="tab"
                                            data-bs-target="#profile" type="button" role="tab" aria-controls="profile"
                                            aria-selected="false">Assigned to
                                    </button>
                                </li>
                            </ul>

                            <div class="tab-content mt-2" id="myTabContent">
                                <div class="tab-pane fade show active" id="home" role="tabpanel"
                                     aria-labelledby="home-tab">
                                    <div class="fs-regular">
                                        <p class="mb-0"><b>Service : {{ serviceInfo.service_name }}</b></p>
                                        <p class="mb-0 mt-4"><b>About :</b></p>
                                        <p class="fs-regular">{{ serviceInfo.description }}</p>
                                    </div>

                                    <!-- Conditionally show buttons based on role -->
                                    <template v-if="role === 'customer'">
                                        <button v-if="serviceInfo.is_accepted_for_me" data-bs-dismiss="modal"
                                                class="btn btn-primary text-white" style="text-decoration: none">
                                            Booked
                                        </button>

                                        <button v-else-if="serviceInfo.is_pending_for_me" type="button"
                                                class="btn btn-danger" disabled>
                                            Approval Pending For this Service
                                        </button>

                                        <div v-if="serviceInfo.num_of_service_pending_for_me > 1" class="alert alert-danger">
                                            You can only request a maximum of 1 service at a time. Please wait until the current request is accepted or completed.
                                        </div>

                                        
                                    </template>
                                </div>

                               
                                
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
</div>


        
    `,

})