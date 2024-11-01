export default ({
    data: () => ({
        loading: false,
        new_service: {
            service_id:'',
            service_name: '',
            base_price: '',
            description: '',
            service_date_created: '',
            service_rating: ''
        },
        services: [],
        bootstrap_modal: {},
        edit_bootstrap_modal: {},
        edit_service: {}
    }),
    computed: {
        role() {
            return localStorage.getItem('role');
        }
    },
    template: `
        <div class="pb-5 mt-3">
        
            <!-- Button trigger modal -->
            <div class="px-3 mt-3">
                <div class="clearfix">
                    <div class="float-start">
                        <h3 class="mb-0">All Services</h3>
                    </div>
                    <div class="float-end">
                        <button type="button" v-if="role == 'admin'" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addNewServiceModal">
                            Add New Service+
                        </button>
                    </div>
                </div>
      
                <div class="row justify-content-left">
                    <div class="col-lg-3 mt-3" style="border-collapse: collapse;" v-for="(service, i) in services" :key="i">
                        <div class="card border-success">
                            <div class="card-header text-success">
                                <div class="clearfix">
                                    <div class="float-start">{{ service.service_name }}</div>
                                    <div class="float-end">
                                        <button class="btn btn-warning btn-sm" v-if="role == 'admin'" @click="editService(service.service_id)">Edit</button>
                                        <button class="btn btn-danger btn-sm" v-if="role == 'admin'" @click="deleteEdit(service.service_id)">Delete</button>
                                        <button class="btn btn-success btn-sm">
                                            <router-link class="text-white" :to="'/service/'+ service.service_id">View</router-link>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body fs-regular">
                                About: {{ service.description }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Service Modal -->
            <div class="modal fade" id="addNewServiceModal" tabindex="-1" aria-labelledby="addNewServiceModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="addNewServiceModalLabel">Add New Service</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Id</label>
                                <input type="number" v-model="new_service.service_id" class="form-control">
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Name</label>
                                <input type="text" v-model="new_service.service_name" class="form-control">
                            </div>
                        </div>
                        <!-- Updated inputs for date, price, rating -->
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Price</label>
                                <input type="number" v-model="new_service.base_price" class="form-control">
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Created Date</label>
                                <input type="date" v-model="new_service.service_date_created" class="form-control">
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Rating</label>
                                <input type="number" v-model="new_service.service_rating" class="form-control" min="1" max="5">
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="form-group">
                                <label class="form-label">Service Description</label>
                                <textarea class="form-control" rows="5" v-model="new_service.description"></textarea>
                            </div>
                        </div>
                    
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success" @click="addService" :disabled="loading">
                        <span v-if="loading" class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
                        ADD Service+
                    </button>
                    <button v-if="role === 'customer'" class="btn btn-success" @click="openRequestForm(service)">Request Service</button>
                </div>
            </div>
        </div>
    </div>
            <!-- Edit Service Modal -->
            <div class="modal fade" id="editServiceModal" tabindex="-1" aria-labelledby="editServiceModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="editServiceModalLabel">Edit Service</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-label">Service Name</label>
                                        <input type="text" v-model="edit_service.service_name" class="form-control">
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-label">Service Description</label>
                                        <textarea class="form-control" rows="5" v-model="edit_service.description"></textarea>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-label">Service Price </label>
                                        <textarea class="form-control" v-model="edit_service.base_price"></textarea>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-label">Service Created Date</label>
                                        <textarea class="form-control" v-model="edit_service.service_date_created"></textarea>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-label">Service Rating</label>
                                        <textarea class="form-control" v-model="edit_service.service_rating"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-success" @click="saveService" :disabled="loading">
                                <span v-if="loading" class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
                                SAVE SERVICE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        editService(service_id) {
            this.edit_bootstrap_modal.show();
            fetch('/api/service/' + service_id, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
            }).then(res => res.json()).then((data) => {
                this.edit_service = data;
            });
        },
        getAllServices() {
            fetch('/api/service', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
            }).then(res => res.json()).then((data) => {
                this.services = data
            })
        },
        saveService() {
            console.log("Edit Service Data:", this.edit_service); // Log data before sending
            this.loading = true;
            fetch('/api/service/' + this.edit_service.service_id, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                body: JSON.stringify(this.edit_service)
            }).then(async (res) => {
                if (res.ok) {
                    this.getAllServices();
                    this.edit_bootstrap_modal.hide();
                    // Clear the edit form
                    this.edit_service = {
                        service_name: '',
                        base_price: '',
                        description: '',
                        service_date_created: '',
                        service_rating: ''
                    };
                } else {
                    let data = await res.json();
                    console.error("Error response:", data); // Log error details
                    alert(data.message || "Unknown error occurred while updating service");
                }
            }).finally(() => {
                this.loading = false;
            });
        },
        
        
        addService() {
            this.loading = true;
        
            fetch('/api/service', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                body: JSON.stringify(this.new_service)
            }).then(async (res) => {
                if (res.ok) {
                    this.getAllServices();
                    this.bootstrap_modal.hide();
                    this.new_service = {
                        service_name: '',
                        base_price: '',
                        description: '',
                        service_date_created: '',
                        service_rating: ''
                    };
                } else {
                    let data = await res.json();
                    console.log(data);  // Log the full response to check its structure
                    alert(JSON.stringify(data.message));  // Convert object to readable string
                }
            }).finally(() => {
                this.loading = false;
            });
        },
        
        deleteEdit(service_id) {
            let confirmation = confirm("Are you sure you want to delete this service?");
            if (!confirmation) {
                return;
            }
            fetch('/api/service/' + service_id, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
            }).then(async (res) => {
                if (res.ok) {
                    this.getAllServices();
                }
            });
        }
    },
    mounted() {
        this.bootstrap_modal = new bootstrap.Modal(document.getElementById('addNewServiceModal'));
        this.edit_bootstrap_modal = new bootstrap.Modal(document.getElementById('editServiceModal'));
    },
    
    created() {
        this.getAllServices();
    }
});
