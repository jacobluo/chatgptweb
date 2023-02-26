import React from "react";
import axios from 'axios';
import cookie from 'react-cookies'
import Chat, {Bubble, useMessages} from "@chatui/core";
import "@chatui/core/dist/index.css";
import Aegis from 'aegis-web-sdk';

const aegis = new Aegis({
    id: 'mZKPYuLWJKV25p04pO', // 上报 id
    reportApiSpeed: true, // 接口测速
    reportAssetSpeed: true, // 静态资源测速
    spa: true, // spa 应用页面跳转的时候开启 pv 计算
    hostUrl: 'https://rumt-zh.com'
});

const chatAPIURL = "http://43.154.26.164:9000/chat"
const imageAPIURL = "http://43.154.26.164:9000/image"


export default function App() {
    const initialMessages = [
        {
            type: 'text',
            content: {text: '我是一个名为ChatGPT的人工智能语言模型，由OpenAI开发和训练。我的目的是为人类提供各种帮助，例如回答问题，提供建议或帮助完成某些任务。您有任何需要，我都会尽力为您提供帮助。'},
            user: { avatar: 'robot.jpeg' },
        }
    ];

    // 默认快捷短语，可选
    const defaultQuickReplies = [
        {
            icon: 'refresh',
            name: '点我重置会话',
        },
        {
            icon: 'camera',
            name: '生成图片',
        },
        {
            icon: 'cancel',
            name: '清空记录',
        }
    ];


    const {messages, appendMsg, setTyping, resetList} = useMessages(initialMessages);

    function handleSend(type, val) {
        if (type === "text" && val.trim()) {
            appendMsg({
                type: "text",
                content: {text: val},
                position: "right",
                user: { avatar: 'human.jpeg' }
            });

            setTyping(true);

            setTimeout(() => {

                let parentMessageId = cookie.load('parentMessageId')
                let conversationId = cookie.load('conversationId')
                let data = {
                    "prompt": val,
                    "conversationId": conversationId,
                    "parentMessageId": parentMessageId
                }
                console.log('send request.');
                console.log(data)

                let isPicMode = 0
                if (val.startsWith('生成图片')) {
                    val = val.replace('生成图片 ', '');
                    isPicMode = 1
                }

                if (isPicMode === 1) {
                    axios.post(imageAPIURL, {"prompt": val})
                        .then(res => {
                            console.log(res.data);
                            appendMsg({
                                type: "image",
                                content: {picUrl: res.data.data[0].url},
                                user: { avatar: 'robot.jpeg' }
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });
                } else {
                    axios.post(chatAPIURL, data)
                        .then(res => {
                            console.log(res.data);
                            cookie.save('parentMessageId', res.data.id)
                            cookie.save('conversationId', res.data.conversationId)

                            appendMsg({
                                type: "text",
                                content: {text: res.data.text},
                                user: { avatar: 'robot.jpeg' }
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }
            }, 1000);
        }
    }

    function handleQuickReplyClick(item) {
        console.log(item.name)
        switch (item.name) {
            case "点我重置会话":
                cookie.save('parentMessageId', "")
                cookie.save('conversationId', "")
                appendMsg({
                    type: "text",
                    content: {text: "好的，会话已经被重置。有什么我能帮到您的吗？"}
                });
                break;
            case "清空记录":
                resetList();
                break;
            case "生成图片":
                appendMsg({
                    type: 'text',
                    content: {
                        text: '请在输入框输入，生成图片 关键字说明，比如"生成图片 足球场地上，有很多郁金香，油画"'
                    }
                })
                break;
        }
    }

    function renderMessageContent(msg) {
        const { type, content } = msg;

        // 根据消息类型来渲染
        switch (type) {
            case 'text':
                return <Bubble content={content.text} />;
            case 'image':
                return (
                    <Bubble type="image">
                        <a href={content.picUrl} target="_blank">点击我新窗口打开</a>
                        <img src={content.picUrl} alt="" />
                    </Bubble>
                );
            default:
                return null;
        }
    }

    return (
        <Chat
            navbar={{title: "MO55"}}
            messages={messages}
            renderMessageContent={renderMessageContent}
            onSend={handleSend}
            quickReplies={defaultQuickReplies}
            onQuickReplyClick={handleQuickReplyClick}
        />
    );
}
