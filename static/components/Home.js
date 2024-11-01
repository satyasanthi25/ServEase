import Service from './Partials/Service.js';
import ServiceDetailsModal from "./Partials/ServiceDetailsModal.js";

export default ({
    data: () => ({
        showModal: false,
        serviceList: [],
        services: []
    }),
    methods: {
        getAllServices() {
            fetch('/api/service', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            }).then(res => res.json()).then((data) => {
                this.serviceList = data;
            })
        },

        showServiceDetail(service) {
            this.$refs.serviceModal.viewModal(service)
        }
    },

    created() {
        this.getAllServices()
    },

    template: `
    <div class="px-3 mt-3 pb-5">
        <div class="wall--bg" style="background: url('static/images/s.jpg') center center; min-height:300px">
            <h1 class="wall--heading ">
            <i class="fas fa-cogs"></i> Welcome to ServEase <i class="fas fa-tools"></i>
            </h1>
        </div>
        <h3 class="mb-0 mt-4">Aviliable Home Services</h3>
        <hr style="border-top: 1px solid #f1f1f1;">
        <h3 class="mb-0 mt-4">What are you looking for?</h3>

        <div class="row justify-content-left">
            <div class="col-lg-2 mt-3" style="border-collapse: collapse;" v-for="(service, i) in serviceList" :key="i">
                <Service
                    @showDetail="showServiceDetail"
                    :key="i" 
                    :service="service"
                />            
            </div>   
        </div>

        <ServiceDetailsModal ref="serviceModal"/>
        <!-- Footer Section -->
        <footer class="mt-5 bg-light py-3 text-center">
            <h5>Connect with us on social media</h5>
            <a href="https://www.facebook.com" target="_blank">
                <img src="static/images/face.jpg" alt="Facebook" width="50" height="50" class="mx-2">
            </a>
            <a href="https://www.twitter.com" target="_blank">
                <img src="static/images/twitter.jpg" alt="Twitter" width="50" height="50" class="mx-2">
            </a>
            <a href="https://www.instagram.com" target="_blank">
                <img src="static/images/insta.jpg" alt="Instagram" width="50" height="50" class="mx-2">
            </a>
            <!-- Customer Section -->
            <div class="footer-section">
                
                <h5>For Customers</h5>
                <a href="/reviews" class="d-block">ServEase Reviews</a>
                <a href="/blog" class="d-block">Blog</a>
                <a href="/contact-us" class="d-block">Contact Us</a>
            </div>

            <!-- Partner Section -->
            <div class="footer-section">
                <h5>For Partners</h5>
                <a href="/register-as-professional" class="d-block">Register as a Professional</a>
            </div>
            <div>
           <i class="fas fa-people" style="color: #E8B86D; font-size:10px">
            <p><b> @2024 ServEase. All rights reserved.</b></p>
           </i> 
            </div>
        </footer>
    </div>
    `,
    components: { Service, ServiceDetailsModal }
})
