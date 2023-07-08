import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Unsubscribe,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  Firestore,
  getFirestore,
  addDoc,
  connectFirestoreEmulator,
  CollectionReference,
  orderBy,
  limit,
} from 'firebase/firestore';
import { environment } from '../../environment';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  username: string = '';
  message: string = '';
  messages: { username: string; message: string }[] = [];
  messageCollection: CollectionReference = this.getMessageCollection();
  unsub: Unsubscribe;

  // subscribe to firebase collection 'messages'
  constructor(private http: HttpClient) {
    const messageCollection = this.getMessageCollection();
    // TODO, limit(100) does not work as no new messages are shown either
    const q = query(messageCollection, orderBy('ts'));
    this.unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.messages.push({
            username: data['username'],
            message: data['message'],
          });
        }
      });
    });
  }

  postMessage() {
    const data = {
      username: this.username,
      message: this.message,
      ts: Date.now(),
    };
    // post data to firebase at collection 'messages'
    // TODO: posting works with postman, in the browser cors block it
    this.http
      .post(environment.apiLocation + '/postMessage', data, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .subscribe(
        (res) => {
          console.log(res);
        },
        (err) => {
          console.log(err);
        }
      );
  }

  getMessageCollection(): CollectionReference {
    const app = initializeApp(environment.firebaseConfig);
    const firestore = getFirestore(app);
    if (!environment.production) {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    }
    return collection(firestore, 'messages', '/');
  }

  ngOnDestroy() {
    this.unsub();
  }
}
