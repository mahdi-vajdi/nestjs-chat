import { io } from 'socket.io-client';
import Cookies from 'universal-cookie';


export const url = process.env.NODE_ENV === "development"
  ? process.env.REACT_APP_API_BASE_URL_DEVELOPMENT
  : process.env.REACT_APP_API_BASE_URL_PRODUCTION;


function socket(chatId:string){
  const cookie = new Cookies();

  const socket = io(`${url}/messages`, {
    query: {chatId: chatId},
    auth: {
      token: `${cookie.get("access")}`
    },
    autoConnect: false,
  });
  return socket;
}


export { socket }