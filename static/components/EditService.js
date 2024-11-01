export default ({
    data: () => ({
        edit_service: {
            service_name: '',
            base_price: '',
            description: '',
            service_date_created: '',
            service_rating: '',
            image: ''
        },
        services: [],
        loading: false
    }),
    methods: {
        getAllServices() {
            fetch('/api/service', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
            })
            .then(res => res.json())
            .then((data) => {
                this.services = data;
            });
        },
    
        getServiceDetails(serviceId) {
            fetch(`/api/service/${serviceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
            })
            .then(res => res.json())
            .then((data) => {
                // Assign data to edit_service to prefill the form fields
                this.edit_service.service_name = data.service_name;
                this.edit_service.base_price = data.base_price;
                this.edit_service.description = data.description;
                this.edit_service.service_date_created = data.service_date_created;
                this.edit_service.service_rating = data.service_rating;
            })
            .catch(error => {
                console.error('Error fetching service details:', error);
            });
        },
    
        editService() {
            this.loading = true;
            let formData = new FormData();
            formData.append("image", this.$refs.serviceImage.files[0]);
            formData.append('service_name', this.edit_service.service_name);
            formData.append('base_price', this.edit_service.base_price);
            formData.append('description', this.edit_service.description);
            formData.append('service_rating', this.edit_service.service_rating);
            formData.append('service_date_created', this.edit_service.service_date_created);
    
            fetch('/api/service/' + this.$route.params.id, {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                method: 'PUT',
                body: formData
            })
            .then(async (res) => {
                if (res.ok) {
                    this.getAllServices();  // Update service list
                    alert("Updated Service Information Successfully");
                    this.edit_service = {
                        service_name: '',
                        base_price: '',
                        description: '',
                        service_date_created: '',
                        service_rating: '',
                        image: ''
                    };
                } else {
                    const errorData = await res.json();
                    alert("Error: " + errorData.message);
                }
            })
            .finally(() => {
                this.loading = false;
            });
        },
        created() {
            this.getAllServices();
            const serviceId = this.$route.params.id;
            this.getServiceDetails(serviceId);
        },
        
    },
    
    template: `
    <div class="px-5 mt-5 pb-5">
        <h4>Edit Service Info</h4>
        <hr>
        <div class="row">
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Service Name</label>
                    <input type="text" v-model="edit_service.service_name" class="form-control">
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Base Price</label>
                    <input type="number" v-model="edit_service.base_price" class="form-control" placeholder="Enter Service Price">

                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Service Description</label>
                    <input type="text" v-model="edit_service.description" class="form-control">
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Service Rating</label>
                    <input type="number" v-model="edit_service.service_rating" class="form-control" placeholder="Enter Service Rating">

                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Service Date Created</label>
                    <input type="date" v-model="edit_service.service_date_created" class="form-control">
                </div>
            </div>
        
            
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-label">Service</label>
                    <select v-model="edit_service.service" class="form-select">
                        <option v-for="(service, i) in services" :key="i" :value="service.service_id">{{service.service_name}}</option>
                    </select>
                </div>
            </div>
            
        <div class="text-end mt-3">
            <button class="btn btn-primary" @click="editService">Save</button>
        </div>
    </div>
    `
});
