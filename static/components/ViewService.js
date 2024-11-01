export default {
    data() {
        return {
            view_service: {
                service_id:'',
                service_name: '',
                description: '',
                service_date_created: '',
                base_price: '',
                service_rating: 0,
            }
        };
    },
    computed: {
        // Check if the logged-in user is a customer
        isCustomer() {
            return localStorage.getItem('role') === 'customer';
        },
        isProfessional() {
            return localStorage.getItem('role') === 'sp';
        }
    },
    methods: {
        // Get service details based on the service ID from the route
        getServiceDetails() {
            fetch('/api/service/' + this.$route.params.id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                method: 'GET',
            })
            .then(res => res.json())
            .then((data) => {
                this.view_service = { ...data };
            });
        },
        requestService() {
            // Route to the service request form page and pass the service ID
            this.$router.push({
                name: 'ServiceRequestForm',  // Name of the route for the form
                params: { serviceId: this.$route.params.id }  // Pass the service ID
            });
        },  

        // Accept the service request
        acceptService() {
            fetch('/api/service/accept/' + this.$route.params.id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                body: JSON.stringify({ status: 'accepted' })
            })
            .then(res => res.json())
            .then(() => {
                // Redirect to MyServices component upon successful acceptance
                this.$router.push({ name: 'MyServices' });
            })
            .catch((error) => {
                console.error('Error accepting service:', error);
            });
        },

        // Reject the service request
        rejectService() {
            fetch('/api/service/reject/' + this.$route.params.id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                body: JSON.stringify({ status: 'rejected' })
            })
            .then(res => res.json())
            .then(() => {
                // Redirect to MyServices component upon successful rejection
                this.$router.push({ name: 'MyServices' });
            })
            .catch((error) => {
                console.error('Error rejecting service:', error);
            });
        },

        // Get rating stars for the service
        getRatingStars(service_rating) {
            const fullStars = Math.floor(service_rating);
            const halfStar = service_rating % 1 !== 0 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;

            let stars = '★'.repeat(fullStars);       // Add full stars
            if (halfStar) stars += '⯪';             // Optionally add a half-star symbol
            stars += '☆'.repeat(emptyStars);        // Add empty stars

            return stars;
        }
    },
    created() {
        this.getServiceDetails();
    },
    template: `
        <div class="service-container card shadow-sm px-4 pb-5 mb-4">
            <div class="card-header bg-success text-white py-3">
                <h2 class="service-title mb-0"><b>{{view_service.service_name}}</b></h2>
            </div>
            <div class="card-body">
                <div class="service-header clearfix mt-4">
                    <div class="float-start">
                        <h4 class="fw-semibold text-primary">Service Details</h4>
                    </div>
                    <div class="float-end text-end service-info">
                        <p class="description mb-2 text-muted"><b>Service ID:</b> {{view_service.service_id}}</p>
                        <p class="description mb-2 text-muted"><b>Description:</b> {{view_service.description}}</p>
                        <p class="text-muted"><b>Date Created:</b> <span class="date-created">{{view_service.service_date_created}}</span></p>
                        <p class="text-muted"><b>Rating:</b> <span v-html="getRatingStars(view_service.service_rating)" class="text-warning"></span></p>
                        <p class="text-muted"><b>Price:</b> <span class="price text-success">{{view_service.base_price | currency}}</span></p>
                    </div>
                </div>
            </div>

            <!-- Service Request Button (Visible only to customers) -->
            <div v-if="isCustomer" class="request-service mt-4 text-center">
                <button class="btn btn-primary px-4 py-2" @click="requestService">Request Service</button>
            </div>

            <div v-if="isProfessional" class="request-service mt-4 text-center">
                <button class="btn btn-success px-4 py-2" @click="acceptService">Accept Service</button>
                <button class="btn btn-danger px-4 py-2" @click="rejectService">Reject Service</button>
            </div>
        </div>
    `,
    filters: {
        // Currency filter for formatting the price
        currency(value) {
            if (!value) return '';
            return '₹' + parseFloat(value).toFixed(2);
        }
    }
};
