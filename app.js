const router = Sammy('#container', function () {

    this.use('Handlebars', 'hbs');

    this.get('/', async function (context) {
        context.redirect('/home')
    });

    this.get('/home', async function (context) {


        

        // loading.textContent = "Loading...";
        // loading.style.display = "inline-block";
        await fetch('https://tripwithme-28e45-default-rtdb.europe-west1.firebasedatabase.app/.json')

            .then(response => response.json())
            .then(data => {

                if (data) {

                    Object.keys(data).map(key => (data[key].creator == context.email ? data[key].isAuthor = true : ""))
                    
                    context.destinations = Object.keys(data).map(key => ({ key, ...data[key] }));
                 }
            })




        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/catalog/home.hbs')
        })

    });

    this.get('/login', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/login/login.hbs')
        })
    });

    this.get('/register', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/register/register.hbs')
        })
    });
});

(() => {
    router.run();
})()