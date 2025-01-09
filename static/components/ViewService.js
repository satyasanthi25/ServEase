export default {
    data() {
        return {
            isLoading: false,
            view_service: {
                service_id: '',
                service_name: '',
                description: '',
                service_date_created: '',
                base_price: '',
                service_rating: 0,
            }
        };
    },
    computed: {
        isCustomer() {
            return localStorage.getItem('role') === 'customer';
        },
        isProfessional() {
            return localStorage.getItem('role') === 'sp';
        }
    },
    methods: {
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
            })
            .catch(error => console.error('Error fetching service details:', error));
        },
        requestService() {
            this.$router.push({
                name: 'ServiceRequestForm',
                params: { serviceId: this.$route.params.id }
            });
        },
        acceptService() {
            fetch('/api/accept-service/' + this.$route.params.id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token'),
                    'role': localStorage.getItem('role')
                },
                body: JSON.stringify({ status: 'accepted' })
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);  // Log the response data for debugging
                this.$router.push({ name: 'MyServices' });
            })
            .catch(error => console.error('Error accepting service:', error));
        },
        
        rejectService() {
            fetch('/api/reject-service/' + this.$route.params.id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token'),
                    'role': localStorage.getItem('role')
                },
                body: JSON.stringify({ status: 'rejected' })
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);  // Log the response data for debugging
                this.$router.push({ name: 'MyServices' });
            })
            .catch(error => console.error('Error rejecting service:', error));
        },
        
        getRatingStars(service_rating) {
            const fullStars = Math.floor(service_rating);
            const halfStar = service_rating % 1 !== 0 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;

            let stars = '★'.repeat(fullStars);
            if (halfStar) stars += '⯪';
            stars += '☆'.repeat(emptyStars);

            return stars;
        }
    },
    created() {
        this.getServiceDetails();
    },
    template: `
        <div class="service-container card shadow-sm px-4 pb-5 mb-4">
            <div class="card-header bg-success text-white py-3">
                <h2 class="service-title mb-0"><b>{{ view_service.service_name }}</b></h2>
            </div>
            <div class="card-body">
                <div class="service-header clearfix mt-4">
                    <div class="float-start">
                        <h4 class="fw-semibold text-primary">Service Details</h4>
                    </div>
                    <div class="float-end text-end service-info">
                        <p class="description mb-2 text-muted"><b>Service ID:</b> {{ view_service.service_id }}</p>
                        <p class="description mb-2 text-muted"><b>Description:</b> {{ view_service.description }}</p>
                        <p class="text-muted"><b>Date Created:</b> <span class="date-created">{{ view_service.service_date_created }}</span></p>
                        <p class="text-muted"><b>Rating:</b> <span v-html="getRatingStars(view_service.service_rating)" class="text-warning"></span></p>
                        <p class="text-muted"><b>Price:</b> <span class="price text-success">{{ view_service.base_price | currency }}</span></p>
                    </div>
                </div>
            </div>

            <div v-if="isCustomer" class="request-service mt-4 text-center">
                <button class="btn btn-primary px-4 py-2" @click="requestService">Request Service</button>
            </div>

            

        </div>
    `,
    filters: {
        currency(value) {
            if (!value) return '';
            return '₹' + parseFloat(value).toFixed(2);
        }
    }
};
