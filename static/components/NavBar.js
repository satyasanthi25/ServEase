export default {
    data() {
        return {
            searchValue: '',
            searchPincode: '',
            searchAddress: '',
            pendingProfessionalsMessage: '',
        };
        
        
    },
    mounted() {
        this.searchValue = this.$route.query.search_value; // Initialize searchValue from the route query
         // Log visit when the component is mounted
        
    },
    methods: {
        async exportcsv() {
            try {
                const response = await fetch('/exportcsv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
        
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.setAttribute('download', 'closed_requests_report.csv');
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                } else {
                    console.error('Failed to fetch the file:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching CSV:', error);
            }
        },
        
        
        search(type) {
            let searchValue;
            
            if (this.role === 'customer') {
                searchValue = type === 'pincode' ? this.searchPincode : this.searchAddress;
            } else {
                searchValue = this.searchValue; // Use searchValue directly for admin and professional
            }
        
            if (!searchValue) {
                alert("Please enter a search term.");
                return;
            }
        
            // Set query with search value and role
            const query = {
                search_value: searchValue,
                role: this.role
            };
        
            if (this.$route.name !== "SearchResult") {
                this.$router.push({ name: 'SearchResult', query });
            } else {
                this.$router.replace({ query });
            }
        },   
        logOutUser(){
            let x  = confirm("Are you certain you wish to log out?");
            if(!x){
                return;
            }
            localStorage.removeItem('auth-token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            this.$router.push({name:"Login"});
        },
        async fetchPendingProfessionals() {
            try {
                const res = await fetch('/pending-professionals');
                const data = await res.json();

                if (res.ok) {
                    this.pendingProfessionalsMessage = data.message || '';
                } else {
                    console.error("Failed to fetch pending professionals:", data.message);
                }
            } catch (err) {
                console.error("Error fetching pending professionals:", err);
            }
        },
    },    
  
    created() {
        const token = localStorage.getItem('auth-token');
        const tokenExpiry = localStorage.getItem('auth-token-expiry');

        // If token is expired, remove it
        if (tokenExpiry && new Date().getTime() > tokenExpiry) {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            this.$router.push({name: "Login"});
        }
        
        this.searchValue = this.$route.query.search_value
        this.fetchPendingProfessionals();
        
    },
    computed: {
        role() {
            return localStorage.getItem('role');
        },
        isLoggedIn() {
            return localStorage.getItem('auth-token');
        },
        username() {
            return localStorage.getItem('username');
        },
        fullname() {
            return localStorage.getItem('fullname') || this.username;  // Fallback to username if fullname is not stored
        },
        // Determine background color based on the role
        roleBackgroundColor() {
            if (this.role === 'admin') {
                return 'bg-admin'; // Admin background color
            } else if (this.role === 'sp') {
                return 'bg-sp'; // Service professional background color
            } else if (this.role === 'customer') {
                return 'bg-customer'; // Customer background color
            } else {
                return ''; // Default (no change)
            }
        }
    },
    
    template: `
    
<div :class="{'bg-admin': role === 'admin', 'bg-sp': role === 'sp', 'bg-customer': role === 'customer'}">
    <div :class="roleBackgroundColor">
        <nav class="navbar navbar-expand-lg border-bottom border-bottom-2" style="background-color: #E7CCCC; color: white;">
            <div class="container-fluid">
                <a class="navbar-brand text-Sucess" href="#"> <h1>ServEase</h1></a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                <hr>
                <ul class="navbar-nav">

                    <template v-if="!isLoggedIn">
                        <!-- Registration Links for Non-Logged Users -->
                        
                        <li class="nav-item">
                            <router-link to="/customer-register" tag="a" class="nav-link text-black">  
                                <h5><b>Customer Register</b></h5>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/sp-register" tag="a" class="nav-link text-black">  
                                <h5><b>Professional Register</b></h5>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/user-login" tag="a" class="nav-link text-black">  
                                <h5><b>Login</b></h5>
                            </router-link>
                        </li> 
                    </template>
                    <template v-if="isLoggedIn">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link">
                            <h5 class="nav-item-title">Home</h5>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/profile" class="nav-link">
                            <h5 class="nav-item-title">Profile</h5>
                            </router-link>
                        </li>
                        <li class="nav-item" v-if="role === 'admin'">
                            <router-link to="/users" class="nav-link">
                                <h5 class="nav-item-title">Users</h5>
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link to="/services" class="nav-link">
                            <h5 class="nav-item-title">Services</h5>
                            </router-link>
                        </li>

                
                        <li class="nav-item" v-if="role === 'admin'">
                            <router-link to="/professionals" class="nav-link">
                            <h5 class="nav-item-title">Professionals</h5>
                            </router-link>
                        </li>

                        <li class="nav-item" v-if="role === 'admin'">
                            <router-link to="/admin/all-requests" class="nav-link">
                            <h5 class="nav-item-title">Service Requests</h5>
                            </router-link>
                        </li>                            

                        <li class="nav-item" v-if="role === 'admin'">
                            <router-link to="/admin-stats" class="nav-link">
                            <h5 class="nav-item-title">Summary</h5>
                            </router-link>
                        </li>

                        <li class="nav-item" v-if="role === 'admin'">
                            <router-link to="/exportcsv" class="nav-link">
                            <button @click="exportcsv">Export CSV</button>
                            </router-link>
                        </li>
                        
                        
                        <!-- Links for Service Professional Role -->
                        <li class="nav-item" v-if="role === 'sp'">
                            <router-link to="/my-services" class="nav-link">
                            <h5 class="nav-item-title">My-Services</h5>
                            </router-link>
                        </li>

                        <li class="nav-item" v-if="role === 'sp'">
                            <router-link to="/prof/all-requests" class="nav-link">
                            <h5 class="nav-item-title">AllRequests</h5>
                            </router-link>
                        </li>

                        <li class="nav-item" v-if="role === 'sp'">
                            <router-link to="/closed-services" class="nav-link">
                            <h5 class="nav-item-title">Closed-Services</h5>
                            </router-link>
                        </li>
                        
                        <!-- Links for Customer Role -->
                        <li class="nav-item" v-if="role === 'customer'">
                            <router-link to="/my-requests" class="nav-link">
                            <h5 class="nav-item-title">My-Requests</h5>
                            </router-link>
                        </li>
                        
                        <li class="nav-item" v-if="role === 'customer'">
                            <router-link to="professionals/similar_location" class="nav-link">
                            <h5>Professionals List</h5>
                            </router-link>
                        </li>
                        

                        <!-- Logout Button -->
                        <li class="nav-item">
                            <button class="btn logout-btn bg-light text-dark border-black" @click="logOutUser()">
                            <b>Log Out</b>
                            </button>
                        </li>
                    </template>
                </ul>
            </div>
        </div>     
    </nav>
    <div v-if="isLoggedIn">
            <!-- Customer Search Section (Inline and Below Navbar) -->
            <div v-if="role === 'customer'" class="search-bar-container d-flex justify-content-end">
                <div class="search-form me-3">
                    <form class="d-flex align-items-center" role="search">
                        <input
                            class="form-control me-2 bg-light text-dark border-black"
                            type="search"
                            placeholder="Search by Pincode"
                            v-model="searchPincode"
                            aria-label="Search by Pincode"
                        >
                        <button type="button" class="btn btn-outline-dark" @click="search('pincode')">
                            <b>Search Pincode</b>
                        </button>
                    </form>
                </div>
                <div class="search-form">
                    <form class="d-flex align-items-center" role="search">
                        <input
                            class="form-control me-2 bg-light text-dark border-black"
                            type="search"
                            placeholder="Search by Address"
                            v-model="searchAddress"
                            aria-label="Search by Address"
                        >
                        <button type="button" class="btn btn-outline-dark" @click="search('address')">
                            <b>Search Address</b>
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <form class="d-flex" role="search" v-if="role === 'sp'">
            <input class="form-control me-2 bg-light text-dark border-black" type="search" 
            placeholder="Search by Customer Name, Address, or Pincode" v-model="searchValue" aria-label="Search" style="width: 450px;">
            <button type="button" class="btn btn-outline-dark" @click="search('service_request')"><b>Search</b></button>
        </form>
        
        <form class="d-flex" role="search" v-if="role === 'admin'">
            <input class="form-control me-2 bg-light text-dark border-black" type="search" placeholder="Search for Professionals" 
            v-model="searchValue" aria-label="Search" style="width: 450px;">
            <button type="button" class="btn btn-outline-dark" @click="search('professional')"><b>Search</b></button>
        </form>
        <div v-if="role === 'admin'">
            <!-- Display Pending Professionals Message -->
            <div v-if="pendingProfessionalsMessage" class="alert alert-info">
                {{ pendingProfessionalsMessage }}
            </div>
        </div>

    </div>          
    
    <div class="nav-item">
        <span class="nav-link" style="color: black; text-align: center;">
            <h4 class="welcome-message" style="font-weight: bold; text-align: center; color: #007bff;">
                Welcome 
                {{ username }}
                <span style="color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.9rem;">
                    {{ role }}
                </span>
            </h4>
        </span>
    </div>




</div>`
};
