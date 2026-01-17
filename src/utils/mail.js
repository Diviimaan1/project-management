import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator =  new Mailgen({
        theme : "default",
        product : {
            name : "Task Manager",
            link : "https://taskmanager.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)

    const emailHtml = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host : process.env.MAILTRAP_SMTP_HOST,
        port : process.env.MAILTRAP_SMTP_PORT,
        auth : {
            user : process.env.MAILTRAP_SMTP_USER,
            pass : process.env.MAILTRAP_SMTP_PASS,
        }
    })

    const mail = {
        from : "mail.taskmanager@example.com",
        to : options.email,
        subject : options.subject,
        text : emailTextual,
        html : emailHtml,
    } 

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed silently. Make sure to provide mailtrap credentials in .env file");
        console.error("Error:",error);
    }
}

const emailVerificationMailContent = ( username,verificationUrl ) => {
    return {
        body : {
            name : username,
            intro : "Welcome to our Basecamp, we are delighted to have you on board.",
            action : {
                instructions : "To verify your email, please click on verify button",
                button : {
                    color : "#22BC66",
                    text : "Verify Email",
                    link : verificationUrl,
                }
            },
            outro : "If you have any queries, reach us out on this email. We will be happy to help."
        }
    }
}

const forgotPasswordMailContent = ( username,passwordResetUrl ) => {
    return {
        body : {
            name : username,
            intro : "A request for resetting password has been generated",
            action : {
                instructions : "To generate a new password, click on reset password button",
                button : {
                    color : "#22BC66",
                    text : "Reset Password",
                    link : passwordResetUrl,
                }
            },
            outro : "If you have any queries, reach us out on this email. We will be happy to help."
        }
    }
}

export {
    emailVerificationMailContent,
    forgotPasswordMailContent,
    sendEmail
}