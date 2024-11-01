export default {
    props: {
        servicepackage: {
            type: Object,
            default(raw) {
                return {service: '', package_id: '', image: ''};
            }
        }
    },
    methods: {
        showDetail(servicepackage) {
            this.$emit('showDetail', servicepackage);
        }
    },
    template: `
        <div v-if="servicepackage" class="text-center justify-content-center pt-3 pb-3 px-2 border border-2 border-secondary">
            <div class="mx-auto border border-2 border-secondary" :style='imagePath'>
            </div>
            <h6 class="mt-2 mb-0 fs-regular fw-bold" style="white-space: break-spaces; min-height: 40px">{{ servicepackage.package_name }}</h6>
            <p class="text-muted fst-italic mb-0">{{ servicepackage.package_rating }}</p>
            <button class="btn btn-sm btn-warning mt-2" @click="showDetail(servicepackage)">View Details</button>
        </div>
    `,
    computed: {
        imagePath: function () {
            if (this.servicepackage && this.servicepackage.hasOwnProperty('image')) {  // Ensure servicepackage is not null
                if (this.servicepackage.image === "") {
                    return "height: 220px;width: 150px;background:url('static/images/1.jpg') center;background-size:cover;";
                } else {
                    return "height: 220px;width: 150px;background:url('/static/uploaded" + this.servicepackage.image + "') center;background-size:cover;";
                }
            } else {
                return '';  // Return an empty string if servicepackage is null or doesn't have 'image'
            }
        }
    }
};    