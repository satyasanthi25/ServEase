export default ({
    props: {
        service: {
            type: Object,
            default() {
                return { service_id: '', image: '', service_name: '', base_price: '', service_rating: '' };
            }
        }
    },
    methods: {
        showDetail(service) {
            this.$emit('showDetail', service);
        }
    },
    template: `
        <div class="text-center pt-3 pb-3 px-2 border border-2 border-secondary rounded shadow-sm service-card">
            <!-- Service Image -->
            <div class="mx-auto border border-2 border-light rounded" 
                 :style="imagePath" 
                 style="height: 220px; width: 150px;">
            </div> 

            <!-- Service Name -->
            <h6 class="mt-2 mb-0 fs-regular fw-bold text-dark" style="white-space: break-spaces; min-height: 40px;">
                {{ service.service_name }}
            </h6>

            <!-- Base Price in Rupees -->
            <p class=" fst-italic mb-1 fw-bold text-dark">
                Base Price: ₹{{ service.base_price }}
            </p>

            <!-- Service Rating -->
            <p class=" fst-italic mb-1 fw-bold text-dark">
                Rating: {{ service.service_rating }} ★
            </p>

            <!-- View Details Button -->
            <button class="btn btn-sm btn-warning mt-2 fw-bold text-dark" @click="showDetail(service)">
                View Details
            </button>
        </div>
    `,
    computed: {
        imagePath: function () {
            if (this.service.hasOwnProperty('image')) {
                if (this.service.image == "") {
                    return "height: 220px;width: 150px;background:url('static/images/home.jpg') center;background-size:cover;";
                } else {
                    return "height: 220px;width: 150px;background:url('static/upload/" + this.service.image + "') center;background-size:cover;";
                }
            } else {
                return ''
            }
        }
    }
    
});
