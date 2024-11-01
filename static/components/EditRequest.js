export default {
    data() {
        return {
            request: {
                service_id: '',
                customer_id: '',
                date_of_request: '',
                service_request_status: 'requested',
                remarks: '',
                is_booked: false,
                is_accepted: false,
                is_closed: false,
                is_requested: true,
                is_pending: false,
                booking_date: ''
            },
            isSubmitting: false // Define isSubmitting here
        };
    },

    created() {
        this.token = localStorage.getItem('auth-token'); // Make sure the key matches exactly
    
        if (!this.token) {
            alert("No authentication token found. Please log in.");
            this.$router.push({ name: 'Login' });
        } else {
            this.requestId = this.$route.params.id;
            if (this.requestId) {
                this.loadRequestData(this.requestId);
            } else {
                alert('Invalid request ID. Unable to edit the service request.');
                this.$router.push({ name: 'MyRequests' });
            }
        }
    },
            
    methods: {
        async loadRequestData(id) {
            try {
                console.log("Token:", this.token);  // Log token to confirm it's present
                const res = await fetch(`/api/service-requests/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': this.token  // Make sure token is correct
                    }
                });
        
                const data = await res.json();
        
                if (res.ok) {
                    this.request.date_of_request = data.date_of_request ? data.date_of_request.split('T')[0] : '';
                    this.request.booking_date = data.booking_date ? data.booking_date.split('T')[0] : '';
                    this.request = { ...this.request, ...data };
                } else {
                    alert(`Error loading request: ${data.message || 'Unauthorized access. Please log in.'}`);
                    this.$router.push({ name: 'MyRequests' });
                }
            } catch (error) {
                console.error('Error loading request data:', error);
                alert('Failed to load request data.');
                this.$router.push({ name: 'MyRequests' });
            }
        },
               
        async submitRequest() {
            if (this.isSubmitting) return;
            this.isSubmitting = true;

            try {
                const url = `/api/service-requests/${this.requestId}`;
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': this.token
                    },
                    body: JSON.stringify(this.request)
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Service request updated successfully!');
                    this.$emit('requestUpdated', data);
                    this.$router.push({ name: 'MyRequests' });
                } else {
                    alert(`Error: ${data.message}`);
                }
            } catch (error) {
                console.error('Error updating service request:', error);
                alert('Something went wrong. Please try again.');
            } finally {
                this.isSubmitting = false;
            }
        }
    },

    template: `
    <div>
        <div class="container">
            <h2>Edit Service Request</h2>
            <div class="form-group">
                <label for="service_id">Service ID</label>
                <input id="service_id" type="number" v-model="request.service_id" class="form-control" placeholder="Enter Service ID" required />
            </div>
            <div class="form-group">
                <label for="customer_id">Customer ID</label>
                <input id="customer_id" type="number" v-model="request.customer_id" class="form-control" placeholder="Enter Customer ID" required />
            </div>
            <div class="form-group">
                <label for="date_of_request">Date of Request</label>
                <input id="date_of_request" type="date" v-model="request.date_of_request" class="form-control" required />
            </div>
            <div class="form-group">
                <label for="booking_date">Date of Booking</label>
                <input id="booking_date" type="date" v-model="request.booking_date" class="form-control" required />
            </div>
            <div class="form-group">
                <label for="service_request_status">Status</label>
                <input id="service_request_status" type="text" v-model="request.service_request_status" class="form-control" placeholder="Enter Status" required />
            </div>
            <div class="form-group">
                <label for="remarks">Remarks</label>
                <input id="remarks" type="text" v-model="request.remarks" class="form-control" placeholder="Enter Remarks" />
            </div>
            <div class="form-group form-check">
                <input id="is_booked" type="checkbox" v-model="request.is_booked" class="form-check-input" />
                <label for="is_booked">Is Booked</label>
            </div>
            <button @click="submitRequest" class="btn btn-success mt-3" :disabled="isSubmitting">Update Request</button>
        </div>
    </div>
    `
};
