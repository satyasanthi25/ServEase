export default ({
    data: () => ({
        searchQuery: ''
    }),
    methods: {
        search() {
            if (this.$route.name !== "SearchResult") {
                this.$router.push({name: 'SearchResult', query: {search_value: this.searchValue}})
            } else {
                const x = this.searchValue
                this.$router.replace({query: {search_value: x}})
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
        }
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
        this.searchValue = this.$route.query.search_value;
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
  <!-- Navbar content here -->
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
                    <router-link to="/about" tag="a" class="nav-link text-black">  
                        <h5><b>About</b></h5>
                    </router-link>
                </li>
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
               
                <!-- Shared Links for All Roles -->
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

                <!-- Links for Admin Role -->
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

                <!-- Links for Service Professional Role -->
                <li class="nav-item" v-if="role === 'sp'">
                    <router-link to="/my-services" class="nav-link">
                    <h5 class="nav-item-title">My-Services</h5>
                    </router-link>
                </li>

                <li class="nav-item" v-if="role === 'sp'">
                    <router-link to="/today-services" class="nav-link">
                    <h5 class="nav-item-title">Today-Services</h5>
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
                    <router-link to="/service-hist" class="nav-link">
                    <h5 class="nav-item-title">Service-History</h5>
                    </router-link>
                </li>

                <!-- Logout Button -->
                <li class="nav-item">
                    <button class="btn logout-btn" @click="logOutUser()">
                    <b>Log Out</b>
                    </button>
                </li>
            </template>
        </ul>
        </div>

        <!-- Search Bar (Visible when Logged In) -->
        <form class="d-flex" role="search" v-if="isLoggedIn">
        <input class="form-control me-2 bg-light text-dark border-black" type="search" placeholder="Search" v-model="searchQuery" aria-label="Search">
        <button type="button" class="btn btn-outline-dark" @click="search"><b>Search</b></button>
        </form>
    </div>
    </nav>
    </div>
    <div class="nav-item">
        <span class="nav-link text-black">
            <h4 class="welcome-message"><b>Welcome {{ fullname }} {{ role }}</b></h4>
        </span>
    </div>
    
</div>`
});
