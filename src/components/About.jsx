import React from "react";
import "../App.css";
import { services } from "../constants";
import ButtonLink from "./ButtonLink";
import Footer from "./Footer";

const ServiceCard = ({ service }) => (
  <div className="sm:w-[250px] w-full">
    <div className="w-full green-pink-gradient p-[1px] rounded-[20px]">
      <div
        className="rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col"
        style={{ background: "#151030" }}
      >
        <img
          src={service.icon}
          alt="service_icon"
          className="w-16 h-16 object-contain"
        />
        <h3 className="text-white text-[20px] font-bold text-center">
          {service.title}
        </h3>
      </div>
    </div>
  </div>
);

const startDate = new Date("2022-03-01");
const currentDate = new Date();
const totalMonths =
  (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
  (currentDate.getMonth() - startDate.getMonth());
const years = Math.floor(totalMonths / 12);
const months = totalMonths % 12;

const About = () => {
  return (
    <div>
      <div
        className="bg-black h-full w-full text-white sm:flex sm:justify-around about py-12 mt-8 overflow-x-hidden"
        id="about"
      >
        <div className="flex flex-col justify-around">
          <div className="sm:px-16 px-2">
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-2">
              Introduction
            </h2>
            <p className="mt-3 mb-6 text-[17px] max-w-3xl leading-[30px]">
              👨‍💻 Hi, I'm Hari, a Software Developer Engineer with {years}.
              {months} years of experience in building dynamic and scalable web
              applications. Currently working at{" "}
              <a
                className="text-green-300 hover:text-green-500 duration-300"
                href="https://m2pfintech.com/"
                target="_blank"
                rel="noreferrer"
              >
                M2P Fintech
              </a>{" "}
              in Chennai, I specialize in full-stack development using ReactJS,
              NodeJS, and Java microservices. I focus on delivering seamless
              user experiences and writing optimized, maintainable code.
              <br />
              ✍️ In my previous role at Atos Pvt Ltd, I led the full development
              lifecycle for Learning Management System modules, utilizing
              MongoDB and ReactJS to create efficient, reusable components.
              <br />
              🚀 I am passionate about cloud technologies, holding
              certifications in Microsoft Azure Fundamentals and Azure Developer
              Associate.
              <br />
            </p>

            <ButtonLink url="/hari.pdf" text="View Resume →" padding={`p-3`} />
          </div>
          <div className="mt-20 flex justify-center flex-wrap gap-7">
            {services.map((service) => (
              <ServiceCard service={service} key={service.title} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
