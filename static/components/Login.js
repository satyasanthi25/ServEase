export default({
    data:()=>({
       user :{
           email:'',
           password:''
       },
        error:'',
        adminMessage:''
    }),
    methods:{
        async login(){
            fetch('/user-login',
                {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(this.user)
                    }
                )

                .then(async (res) => {
                    const data = await res.json();
                    if (res.ok) {
                        localStorage.setItem('auth-token', data.token);
                        localStorage.setItem('role', data.role);
                        localStorage.setItem('username',data.username);
                        localStorage.setItem('id',data.id);
                        this.adminMessage = data.message || '';
                
                        // Role-based redirection after successful login
                        if (data.role === 'admin') {
                            this.$router.push({ path: '/admin-dashboard' });
                        } else if (data.role === 'sp') {
                            this.$router.push({ path: '/professional-dashboard' });
                        } else {
                            this.$router.push({ path: '/customer-dashboard' });
                        }
                    } else {
                        this.error = data.message;
                    }
                });
                
        }
    },
    template:`
    <div class="row">
  <div class="col-lg-6 pb-5" style="height:100vh; background:url('static/images/login.jpeg') center center no-repeat; background-size:cover;"></div>
  <div class="col-lg-6 d-flex align-items-center">
    <div class="row justify-content-center w-100">
      <div class="col-lg-8">
        <div class="login-box p-5" style="background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">
          <h1 class="text-center mb-4" style="font-size: 2.5rem; font-weight: bold;">Login</h1>

          <!-- Error Message for Professionals -->
          <div class="alert alert-danger" v-if="error !== ''">
            {{ error }}
          </div>

          <!-- Admin Message -->
          <div class="alert alert-info" v-if="adminMessage !== ''">
            {{ adminMessage }}
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Email</label>
            <input type="email" v-model="user.email" class="form-control" required />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Password</label>
            <input type="password" v-model="user.password" class="form-control" required />
          </div>
          <div class="form-group mt-4 text-center">
            <button class="btn btn-primary btn-block w-100 py-2" @click="login">
              LOGIN
            </button>
          </div>
          <p class="mt-3 text-center">Don't have an account yet?</p>
          <div class="text-center">
            <router-link to="/customer-register" class="btn btn-outline-primary">Customer Register</router-link>
            <router-link to="/sp-register" class="btn btn-outline-primary" style="margin-top: 10px;">Professional Register</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `
})