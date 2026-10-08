import java.util.Set;
import javax.management.ObjectName;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

/**
 * Asks the running stand (Spring Boot admin MBean on JMX 127.0.0.1:9191) whether its OpenAI keys are configured.
 * Prints "<property> set" or "<property> missing" per key, never the value. Exit 0: all set, 1: one missing,
 * 2: the stand did not answer over JMX. Run: java tools/StandKeyCheck.java [jmx port]
 */
public class StandKeyCheck {
    static final String[] KEYS = {"spring.ai.openai.api-key", "crm.dynmodel.api-key"};
    // the defaults in application.properties and stands.sh when no key reaches the stand
    static final Set<String> PLACEHOLDERS = Set.of("setup-required", "<YOUR_API_KEY>");

    public static void main(String[] args) {
        String port = args.length > 0 ? args[0] : "9191";
        int exit = 0;
        try (JMXConnector connector = JMXConnectorFactory.connect(
                new JMXServiceURL("service:jmx:rmi:///jndi/rmi://127.0.0.1:" + port + "/jmxrmi"))) {
            var admin = new ObjectName("org.springframework.boot:type=Admin,name=SpringApplication");
            for (String key : KEYS) {
                Object value = connector.getMBeanServerConnection().invoke(
                        admin, "getProperty", new Object[]{key}, new String[]{String.class.getName()});
                boolean set = value instanceof String s && !s.isBlank() && !PLACEHOLDERS.contains(s.strip());
                System.out.println(key + (set ? " set" : " missing"));
                if (!set) exit = 1;
            }
        } catch (Exception e) {
            // the exception class only: a message could in theory carry data from the stand
            System.out.println("jmx-error " + e.getClass().getSimpleName());
            exit = 2;
        }
        System.exit(exit);
    }
}
