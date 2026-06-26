const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
if (!fs.existsSync('public/uploads/')) {
    fs.mkdirSync('public/uploads/', { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const mockConcerts = [
    { id: 1, title: '2026 부산 록 페스티벌', image: '/images/부락페.png', date: '2026.10.02 - 10.04' },
    { id: 2, title: '트와이스', image: '/images/twice.jpg', date: '2026.07.10 - 07.12' },
    { id: 3, title: '코르티스', image: '/images/cortis.jpg', date: '2026.07.18 - 07.19' },
    { id: 4, title: '데이식스', image: '/images/day6.jpg', date: '2026.07.03 - 07.05' },
    { id: 5, title: '2026 워터밤', image: '/images/waterbomb.jpg', date: '2026.07.24 - 07.26' },
    { id: 6, title: '르세라핌', image: '', date: '2026.7.11 - 7.12' }
];

const randomFirst = ['신난', '춤추는', '노래하는', '기분좋은', '힙한', '들뜬', '몽환적인'];
const randomLast = ['록스타', '발라더', '드러머', '레드레드', '페스티벌러', '메이트'];

const registeredUsers = [
    { username: 'admin', password: '121', nickname: '202412730', gender: '여자', age: '20', profileImg: '' }
];

let currentUserSession = null;

let allPosts = [
    {
        id: 101,
        concertId: 1,
        concertTitle: '2026 부산 록 페스티벌',
        title: '락페 첫날 같이 오프닝 달리실 분!',
        content: '체력 좋으신 분 환영합니다. 매너 지키면서 재밌게 놀아요!',
        dates: ['2026-10-02'],
        views: 45,
        createdAt: new Date(Date.now() - 1000 * 60 * 35),
        username: 'admin'
    },
    {
        id: 102,
        concertId: 2,
        concertTitle: '트와이스',
        title: '트와이스 막콘 양일 동행 구해요',
        content: '굿즈 줄 같이 서실 분 구합니다.',
        dates: ['2026-07-12'],
        views: 12,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        username: 'admin'
    }
];
let allComments = [
    { id: 1, postId: 101, username: 'admin', text: '저 조건 맞는데 같이 가요!' }
];

app.get('/', (req, res) => {
    const hotPosts = allPosts.map(post => {
        const commentCount = allComments.filter(c => c.postId === post.id).length;
        const score = (post.views || 0) + (commentCount * 2);
        const writer = registeredUsers.find(u => u.username === post.username) || { nickname: '탈퇴회원' };
        return { ...post, commentCount, score, nickname: writer.nickname };
    });

    hotPosts.sort((a, b) => b.score - a.score);
    const topPosts = hotPosts.slice(0, 3);
    res.render('index', {
        concerts: mockConcerts,
        user: currentUserSession,
        activePosts: topPosts
    });
});

app.get('/posts', (req, res) => {
    const selectedConcertId = req.query.concertId;

    let selectedDates = req.query.date ? (Array.isArray(req.query.date) ? req.query.date : [req.query.date]) : [];
    let selectedAges = req.query.age ? (Array.isArray(req.query.age) ? req.query.age : [req.query.age]) : [];
    let selectedGenders = req.query.gender ? (Array.isArray(req.query.gender) ? req.query.gender : [req.query.gender]) : [];

    if (req.query['age[]']) selectedAges = selectedAges.concat(Array.isArray(req.query['age[]']) ? req.query['age[]'] : [req.query['age[]']]);
    if (req.query['gender[]']) selectedGenders = selectedGenders.concat(Array.isArray(req.query['gender[]']) ? req.query['gender[]'] : [req.query['gender[]']]);

    if (selectedConcertId) {
        allPosts.forEach(post => {
            if (post.concertId == selectedConcertId) {
                post.views = (post.views || 0) + 1;
            }
        });
    }

    let populatedPosts = allPosts.map(post => {
        const writer = registeredUsers.find(u => u.username === post.username) || {
            nickname: '알수없음', age: '20', gender: '무관', profileImg: ''
        };
        return {
            ...post,
            nickname: writer.nickname,
            age: writer.age,
            gender: writer.gender,
            profileImg: writer.profileImg
        };
    });

    if (selectedConcertId) populatedPosts = populatedPosts.filter(post => post.concertId == selectedConcertId);

    if (selectedDates.length > 0 && selectedDates[0] !== "") {
        populatedPosts = populatedPosts.filter(post => post.dates && post.dates.some(d => selectedDates.includes(d)));
    }
    if (selectedAges.length > 0 && selectedAges[0] !== "") {
        populatedPosts = populatedPosts.filter(post => selectedAges.includes(String(post.age)));
    }
    if (selectedGenders.length > 0 && selectedGenders[0] !== "") {
        populatedPosts = populatedPosts.filter(post => selectedGenders.includes(String(post.gender)));
    }

    const populatedComments = allComments.map(comment => {
        const cWriter = registeredUsers.find(u => u.username === comment.username) || { nickname: '알수없음' };
        return { ...comment, nickname: cWriter.nickname };
    });

    const currentConcert = mockConcerts.find(c => c.id == selectedConcertId);

    res.render('detail', {
        concerts: mockConcerts,
        posts: populatedPosts,
        comments: populatedComments,
        user: currentUserSession,
        concert: { title: currentConcert ? currentConcert.title : '전체 공연' },
        filters: {
            concertId: selectedConcertId,
            age: selectedAges,
            gender: selectedGenders,
            date: selectedDates
        }
    });
});

app.get('/form', (req, res) => {
    res.render('form', { user: currentUserSession, concerts: mockConcerts });
});

let allQnA = [
    { id: 1, title: '혹시 공연 일정을 제가 직접 등록 요청해도 되나요?', author: '익명의 리스너', status: 'complete', answer: '안녕하세요! 네, 당연히 가능합니다. 원하시는 공연 이름, 날짜, 포스터를 본 게시판에 비밀글로 올려주시면 확인 후 캘린더에 반영해 드리겠습니다. 오늘도 즐거운 공연 되세요 🤘' },
    { id: 2, title: '동행 모집글 작성했는데 수정은 어떻게 하나요? 오타가 났어요 ㅠㅠ', author: '수전증락커', status: 'waiting', answer: '' }
];

app.get('/QNA', (req, res) => {
    res.render('QNA', {
        user: currentUserSession,
        concerts: mockConcerts,
        qnaList: allQnA
    });
});

app.post('/qna/create', (req, res) => {
    if (!currentUserSession) return res.send('<script>alert("로그인이 필요합니다."); location.href="/form";</script>');

    allQnA.unshift({
        id: Date.now(),
        title: req.body.title,
        author: currentUserSession.nickname,
        status: 'waiting',
        answer: ''
    });
    res.redirect('/QNA');
});

app.post('/qna/answer', (req, res) => {
    if (!currentUserSession || currentUserSession.username !== 'admin') {
        return res.status(403).send('<script>alert("관리자 권한이 없습니다."); history.back();</script>');
    }

    const qna = allQnA.find(q => q.id == req.body.qnaId);
    if (qna) {
        qna.answer = req.body.answerText;
        qna.status = 'complete';
    }
    res.redirect('/QNA');
});

app.get('/api/check-id', (req, res) => {
    const requestedId = req.query.username;
    const exists = registeredUsers.some(u => u.username === requestedId);
    res.json({ available: !exists });
});

app.get('/mypage', (req, res) => {
    if (!currentUserSession) return res.send('<script>alert("로그인이 필요한 페이지입니다."); location.href="/form";</script>');

    const myPosts = allPosts.filter(post => post.username === currentUserSession.username).map(post => {
        const commentCount = allComments.filter(c => c.postId === post.id).length;
        return { ...post, commentCount };
    });

    const myComments = allComments.filter(comment => comment.username === currentUserSession.username).map(comment => {
        const targetPost = allPosts.find(p => p.id === comment.postId);
        return {
            ...comment,
            concertTitle: targetPost ? targetPost.concertTitle : '기타 공연',
            concertId: targetPost ? targetPost.concertId : ''
        };
    });

    res.render('mypage', { user: currentUserSession, concerts: mockConcerts, posts: myPosts, comments: myComments });
});

app.post('/signup', upload.single('profileImg'), (req, res) => {
    const { username, password, nickname, gender, age } = req.body;
    if (registeredUsers.some(u => u.username === username)) return res.send('<script>alert("이미 사용 중인 아이디입니다."); history.back();</script>');

    let finalNickname = nickname;
    if (!nickname || nickname.trim() === '') {
        finalNickname = `${randomFirst[Math.floor(Math.random() * randomFirst.length)]} ${randomLast[Math.floor(Math.random() * randomLast.length)]}`;
    }

    registeredUsers.push({
        username, password, nickname: finalNickname, gender, age,
        profileImg: req.file ? '/uploads/' + req.file.filename : ''
    });
    res.send('<script>alert("회원가입이 완료되었습니다! 로그인해 주세요."); location.href="/form";</script>');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = registeredUsers.find(u => u.username === username && u.password === password);
    if (user) {
        currentUserSession = user;
        res.redirect('/');
    } else {
        res.send('<script>alert("아이디 또는 비밀번호가 틀렸습니다."); history.back();</script>');
    }
});

app.get('/logout', (req, res) => {
    currentUserSession = null;
    res.redirect('/');
});

app.post('/mypage/update', upload.single('profileImg'), (req, res) => {
    if (!currentUserSession) return res.status(403).send('권한이 없습니다.');
    const { nickname, gender, age } = req.body;
    const user = registeredUsers.find(u => u.username === currentUserSession.username);
    if (user) {
        user.nickname = nickname; user.gender = gender; user.age = age;
        if (req.file) user.profileImg = '/uploads/' + req.file.filename;
        currentUserSession = user;
    }
    res.send('<script>alert("프로필 정보가 수정되었습니다!"); location.href="/mypage";</script>');
});

app.post('/posts/create', (req, res) => {
    if (!currentUserSession) return res.send('<script>alert("로그인이 필요합니다."); location.href="/form";</script>');

    const { concertId, title, content } = req.body;
    let postDates = req.body.postDates || req.body['postDates[]'] || [];
    let finalDates = [];

    if (Array.isArray(postDates)) {
        postDates.forEach(d => {
            if (typeof d === 'string' && d.includes(',')) finalDates = finalDates.concat(d.split(',').map(item => item.trim()));
            else if (d) finalDates.push(String(d).trim());
        });
    } else if (typeof postDates === 'string') {
        if (postDates.includes(',')) finalDates = postDates.split(',').map(item => item.trim());
        else if (postDates.trim() !== '') finalDates.push(postDates.trim());
    }

    const now = new Date();
    allPosts.unshift({
        id: Date.now(),
        concertId: parseInt(concertId),
        concertTitle: mockConcerts.find(c => c.id == concertId)?.title || '기타 공연',
        title, content, dates: finalDates,
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        views: 0, createdAt: new Date(), username: currentUserSession.username
    });
    res.redirect(`/posts?concertId=${concertId}`);
});

app.post('/posts/update', (req, res) => {
    if (!currentUserSession) return res.status(403).send("권한이 없습니다.");

    const { postId, title, content } = req.body;
    let postDates = req.body.postDates || req.body['postDates[]'] || [];
    let finalDates = [];

    if (Array.isArray(postDates)) {
        postDates.forEach(d => {
            if (typeof d === 'string' && d.includes(',')) finalDates = finalDates.concat(d.split(',').map(item => item.trim()));
            else if (d) finalDates.push(String(d).trim());
        });
    } else if (typeof postDates === 'string') {
        if (postDates.includes(',')) finalDates = postDates.split(',').map(item => item.trim());
        else if (postDates.trim() !== '') finalDates.push(postDates.trim());
    }

    const post = allPosts.find(p => p.id == postId);
    if (post && post.username === currentUserSession.username) {
        post.title = title; post.content = content; post.dates = finalDates;
        return res.send(`<script>alert("모집글이 성공적으로 수정되었습니다."); location.href="/posts?concertId=${post.concertId}";</script>`);
    }
    res.status(403).send("권한이 없습니다.");
});

app.post('/posts/comment', (req, res) => {
    if (!currentUserSession) return res.send('<script>alert("로그인이 필요합니다."); location.href="/form";</script>');
    allComments.push({
        id: Date.now(), postId: parseInt(req.body.postId),
        username: currentUserSession.username, text: req.body.commentText
    });
    res.redirect(req.headers.referer || '/posts');
});

app.post('/posts/delete', (req, res) => {
    if (!currentUserSession) return res.status(403).send("권한이 없습니다.");
    const postIndex = allPosts.findIndex(p => p.id == req.body.postId);
    if (postIndex !== -1 && allPosts[postIndex].username === currentUserSession.username) {
        const targetConcertId = allPosts[postIndex].concertId;
        allPosts.splice(postIndex, 1);
        return res.send(`<script>alert("모집글이 정상적으로 삭제되었습니다."); location.href="/posts?concertId=${targetConcertId}";</script>`);
    }
    res.status(403).send("삭제 권한이 없습니다.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});