export default {
    name: 'AboutPage',
    data() {
        return {
            aboutData: null, // Store fetched data here
        };
    },
    methods: {
        fetchAboutData() {
            fetch('/api/about')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.aboutData = data;
                })
                .catch(error => {
                    console.error('Error fetching about data:', error);
                    alert('Failed to load About page data');
                });
        }
    },
    created() {
        this.fetchAboutData(); // Fetch data when component is created
    },
    template: `
        <div class="container">
            <h1>About Us</h1>
            <p v-if="!aboutData">Loading...</p>
            <p v-else>Welcome to our website! We specialize in providing high-quality service for various clients.</p>
            
            <div v-if="aboutData" class="about-page">
                <header>
                    <h1>Welcome to Your Trusted Household Services</h1>
                    <p>{{ aboutData.introduction }}</p>
                </header>

                <section class="about-content">
                    <div class="mission">
                        <h2>Our Mission</h2>
                        <p>{{ aboutData.mission }}</p>
                    </div>

                    <div class="why-choose-us">
                        <h2>Why Choose Us?</h2>
                        <ul>
                            <li v-for="reason in aboutData.why_choose_us" :key="reason">{{ reason }}</li>
                        </ul>
                    </div>

                    <div class="features">
                        <h2>App Features</h2>
                        <p>Here’s a quick look at what our app has to offer:</p>
                        <ul>
                            <li v-for="feature in aboutData.features" :key="feature.title">
                                <strong>{{ feature.title }}:</strong> {{ feature.description }}
                            </li>
                        </ul>
                    </div>

                    <div class="get-started">
                        <h2>Get Started Today!</h2>
                        <p>Discover the convenience of managing household services with ease. Book your first service and experience the peace of mind that comes with a reliable platform.</p>
                        <router-link to="/services" class="cta-button">Explore Services</router-link>
                    </div>
                </section>
            </div>
        </div>
    `
};
