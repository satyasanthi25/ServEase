export default {
    data: () => ({
        results: [],
        role: '',
        errorMessage: '',
        searchValue: ''
    }),
    mounted() {
        this.fetchResults();
    },
    watch: {
        '$route.query.search_value': 'fetchResults',  // Refetch if the search query changes
        '$route.query.role': 'fetchResults'  // Refetch if the role changes
    },
    methods: {
        async fetchResults() {
            const searchValue = this.$route.query.search_value;
            const role = this.$route.query.role;
            this.role = role;
            
            // Validate search input
            if (!searchValue) {
                this.errorMessage = "Please enter a search term.";
                this.results = [];
                return;
            }
        
            // Determine the search type based on the role
            let searchType;
            if (role === 'admin') {
                searchType = 'professional';
            } else if (role === 'sp') {
                searchType = 'service_request'; // New search type for service professionals
            } else {
                searchType = 'service'; // Default for customers
            }
        
            // Construct the search URL based on the role and search type
            const url = `/api/search-result?type=${searchType}&query=${encodeURIComponent(searchValue)}&role=${role}`;
        
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
        
                if (!response.ok) {
                    this.errorMessage = `Failed to fetch results: ${response.statusText}`;
                    this.results = [];
                    return;
                }
        
                const data = await response.json();
        
                // Handle the results based on the role
                if (role === 'sp') {
                    this.results = data.service_requests || [];
                } else if (role === 'customer') {
                    this.results = data.services || [];
                } else {
                    this.results = data || [];
                }
        
                this.errorMessage = '';
            } catch (error) {
                this.errorMessage = "Error fetching search results.";
                console.error("Error fetching search results:", error);
            }
        },
        
        async toggleBlockUser(userId, isBlocked) {
            const action = isBlocked ? "unblock" : "block";
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`/api/${action}-user/${userId}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    }
                });

                if (!response.ok) {
                    console.error(`Failed to ${action} user:`, response.statusText);
                    return;
                }
                console.log(`User with ID: ${userId} ${isBlocked ? "unblocked" : "blocked"} successfully.`);
                this.fetchResults();
            } catch (error) {
                console.error(`Error ${action}ing user:`, error);
            }
        }
    },
    template: `
    <div>
        <h2>Search Results for "{{ $route.query.search_value }}"</h2>
        <p v-if="errorMessage">{{ errorMessage }}</p>
        
        <!-- Admin view: Manage professionals -->
        <ul v-if="role === 'admin'">
            <li v-for="result in results" :key="result.id" class="result-card admin-result">
                <p><strong>Name:</strong> {{ result.fullname }}</p>
                <p><strong>Email:</strong> {{ result.email }}</p>
                <p><strong>Experience:</strong> {{ result.experience_years }} years</p>
                <p><strong>Service Type:</strong> {{ result.service_name }}</p>
                <p><strong>Status:</strong> {{ result.is_blocked ? 'Blocked' : 'Active' }}</p>
                <button 
                    @click="toggleBlockUser(result.id, result.is_blocked)"
                    :class="result.is_blocked ? 'btn-unblock' : 'btn-block'">
                    {{ result.is_blocked ? 'Unblock' : 'Block' }}
                </button>
            </li>
        </ul>

        <!-- Customer view: Display services in card format -->
        <div class="card-container" v-else-if="role === 'customer'">
            <div v-for="result in results" :key="result.id" class="card">
                <div class="card-header">
                    <h3>{{ result.service_name }}</h3>
                </div>
                <div class="card-body">
                    <p><strong>Address:</strong> {{ result.address }}</p>
                    <p><strong>Pin Code:</strong> {{ result.pin_code }}</p>
                    <p><strong>Base Price:</strong> {{ result.base_price ? '₹' + result.base_price : 'Not specified' }}</p>
                    <p><strong>Description:</strong> {{ result.description }} </p>
                </div>
                <div class="card-footer">
                    <span style="color: #ff9800;"></span>
                </div>

            </div>
        </div>
        
        <!-- Service Professional view: Display service requests -->
        <ul v-else-if="role === 'sp'">
            <li v-for="result in results" :key="result.id" class="result-card sp-result">
                <p><strong>Service Name:</strong> {{ result.service_name }}</p>
                <p><strong>Customer Name:</strong> {{ result.customer_name }}</p>
                <p><strong>Status:</strong> {{ result.service_request_status }}</p>
                <p><strong>Request Date:</strong> {{ result.date_of_request }}</p>
                <p><strong>Booking Date:</strong> {{ result.booking_date }}</p>
            </li>
        </ul>

        <!-- Fallback for empty results and unknown roles -->
        <p v-if="results.length === 0 && !errorMessage">No results found.</p>
        <p v-else-if="!['admin', 'customer', 'sp'].includes(role)">Invalid role specified.</p>
    </div>
    `,
};
