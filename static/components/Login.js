export default({
    data:()=>({
       user :{
           email:'',
           password:''
       },
        error:''
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
  <!-- Left side background image -->
  <div class="col-lg-6 pb-5" style="height:100vh; background:url('static/images/login.jpeg') center center no-repeat; background-size:cover;">
  </div>
  
  <!-- Right side Login form -->
  <div class="col-lg-6 d-flex align-items-center">
    <div class="row justify-content-center w-100">
      <div class="col-lg-8">
        <div class="login-box p-5" style="background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">
          <h1 class="text-center mb-4" style="font-size: 2.5rem; font-weight: bold; color: #333; text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);">Login</h1>
          
          <div class="alert alert-danger" v-if="error != ''">
            {{error}}
          </div>
          
          <!-- Email Input -->
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: bold;">Email</label>
            <input type="email" v-model="user.email" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
          </div>
          
          <!-- Password Input -->
          <div class="form-group mb-3">
            <label class="form-label" style="font-weight: bold;">Password</label>
            <input type="password" v-model="user.password" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc;"/>
          </div>
          
          <!-- Login Button -->
          <div class="form-group mt-4 text-center">
            <button class="btn btn-dark btn-block w-100 py-2" @click="login" 
                    style="background-color: #5A67D8; border:none; border-radius: 25px; font-size: 1.2rem; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); transition: all 0.3s ease;">
              LOGIN
            </button>
          </div>
          
          <p class="mt-3 text-center" style="font-size: 0.9rem;">Don't have an account yet?</p>
          
          <!-- Register Link -->
          <div class="text-center">
            <div>
              <router-link to="/customer-register" class="btn btn-outline-dark" 
                          style="text-decoration: none; color: #5A67D8; font-weight: bold;">Customer Register</router-link>
            </div>              
            <div style="margin-top: 10px;">           
              <router-link to="/sp-register" class="btn btn-outline-dark" 
                          style="text-decoration: none; color: #5A67D8; font-weight: bold;">Professional Register</router-link>             
            </div>
          </div>  
        </div>
      </div>
    </div>
  </div>
</div>



    `
})