firebase.initializeApp({
  apiKey: "AIzaSyAz_QQGLibCZxeYQGD7K-2CwNKp13RKT2I",
  authDomain: "ttgo-league.firebaseapp.com",
  databaseURL: "https://ttgo-league-default-rtdb.firebaseio.com",
  projectId: "ttgo-league",
  storageBucket: "ttgo-league.firebasestorage.app",
  messagingSenderId: "928846732074",
  appId: "1:928846732074:web:26baa81874ca8374595c53"
});
const db = firebase.database();
// Firebase 초기화 후 데이터 로드 + 저장 테스트
loadFromFirebase();
// 현재 ST 데이터 즉시 저장
saveToFirebase();