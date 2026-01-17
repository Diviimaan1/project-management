import Mailgen from "mailgen";

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
}