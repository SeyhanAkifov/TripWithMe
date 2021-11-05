let errorBox = document.getElementsByClassName('notification errorBox')[0];
let successBox = document.getElementsByClassName('notification infoBox')[0];
let loading = document.getElementsByClassName('notification loadingBox')[0];

const router = Sammy('#container', function () {

    this.use('Handlebars', 'hbs');

    this.get('/', async function (context) {
        context.redirect('/home')
    });

    this.get('/home', async function (context) {

        checkAuth(context);
        

        loading.textContent = "Loading...";
        loading.style.display = "inline-block";

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
        }).then(loading.style.display = "none")

    });

    this.get('/login', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/login/login.hbs')
        })
    });

    this.post('/login', function (context) {


        const { email, password } = context.params

        if (!email || !password) {
            return
        }
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userInfo) => {
                localStorage.setItem('userInfo', JSON.stringify({ uid: userInfo.user.uid, email: userInfo.user.email }));
                context.redirect('/home')
                showMessage(successBox, "Login successful.");
            })
            .catch(function (error) {
                
                var errorCode = error.code;
                var errorMessage = error.message;
                showMessage(errorBox, error.message);
            });
    });

    this.get('/register', async function (context) {

        await this.loadPartials({
            'header': './templates/common/header.hbs',
            'footer': './templates/common/footer.hbs',
            
        }).then(function () {
            this.partial('../templates/register/register.hbs')
        })
    });

    this.post('/register', function (context) {
        const { email, password, rePassword } = context.params;

        if (!email || !password || !rePassword) {
            showMessage(errorBox, "Invalid inputs");
            return
        }
        if (password !== rePassword) {

            showMessage(errorBox, "Passwords doesnt match");
            return;
        }
        console.log(context)

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((createdUser) => {
                context.redirect('/login')
                showMessage(successBox, "User registration successful.");
            })
            .catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                showMessage(errorBox, errorMessage);
                
        });
    });

    this.get('/logout', function (context) {
        console.log(context)
        firebase.auth().signOut()
            .then(function () {
                localStorage.removeItem('userInfo');
                context.loggedIn = false
                context.redirect('/home');
                showMessage(successBox, "Logout successful");
            }).catch(function (error) {
                showMessage(errorBox, error.message);
            })

    });

    function checkAuth(context) {

        if (localStorage.userInfo) {
            const { uid, email } = JSON.parse(localStorage.userInfo)
            context.loggedIn = true;
            context.uid = uid;
            context.email = email;
        };
    };

    function showMessage(type, message) {


        type.textContent = message;
        type.style.display = "inline-block";


        setTimeout(() => {
            type.style.display = "none"
        }, 3000)


    };
});

(() => {
    router.run();
})()